import './home.less';

const FOLDER_PREFIX = 'folder/';

$(() => {
  const global_status = $('.global-status');
  let bucket;

  const scope_aws = {};
  const scope_loader = {};
  const scope_uploader = {};

  // aws
  (() => {
    const init = () => {
      return $.when($.get('/aws-config'), $.getScript('https://sdk.amazonaws.com/js/aws-sdk-2.283.1.min.js')).then((r) => {
        const aws = r[0];
        AWS.config.region = aws.region;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({ IdentityPoolId: aws.identity });
        AWS.config.credentials.get((e) => {
          if (e) return { error: e };
        });
        bucket = new AWS.S3({ params: { Bucket: aws.bucketName, Prefix: FOLDER_PREFIX } });
        return;
      });
    };

    scope_aws.init = init;
  })();

  // loader
  (() => {
    let items = [];

    const container = $('.items-container');
    const header = container.find('[data-header]');
    const header_span = header.find('span');

    const btn_filter = container.find('a[data-action=filter]');
    const div_filter = container.find('[data-header=filter]');
    const inp_filter = div_filter.find('input');

    const btn_load = container.find('a[data-action=load]');

    const __render = () => {
      container.find('div:not([data-header])').remove();

      const items_filtered = [...items].filter((x) => {
        return x.Key.includes((inp_filter.val() || '').trim());
      });

      items_filtered.map((x) => {
        container.append(`<div data-row>${x.Key}</div>`);
      });

      let header_text = header_span.attr('data-text') + `: ${items.length}`;
      if (items_filtered.length != items.length) header_text += ` - ${header_span.attr('data-text-filtered')}: ${items_filtered.length}`;
      header_span.text(header_text);
    };

    const load = () => {
      return new Promise((resolve) => {
        container.css('opacity', '.3');
        return bucket.listObjects((e, d) => {
          items = d.Contents;
          return resolve(__render());
        });
      }).then(() => {
        container.css('opacity', '1');
      });
    };

    const init = () => {
      btn_filter.on('click', () => {
        div_filter.toggleClass('d-none');
      });
      inp_filter.on('keyup', (e) => {
        return __render();
      });
      btn_load.on('click', () => {
        load();
      });

      load();
    };

    scope_loader.load = load;
    scope_loader.init = init;
  })();

  // uploader
  (() => {
    const overlay = $('.overlay');

    const __upload = (file) => {
      const container = $('.upload-status-template').clone();
      container.insertAfter($('.upload-status-template'));
      container.removeClass('upload-status-template d-none');

      const prg_wrp = container.find('.progress');
      const prg_bar = prg_wrp.find('.progress-bar');
      const prg_bar_lbl = prg_wrp.find('small');

      const lbl_time = container.find('.time');
      const lbl_name = container.find('.name');
      const lbl_size = container.find('.size');
      const lbl_link = container.find('.link');

      container.attr('data-status', 'uploading');

      return new Promise((resolve) => {
        if (!file) return resolve({ error: 'file' });

        const key = FOLDER_PREFIX + new Date().getTime() + '_' + file.name.replace(/ /gi, '-');
        const params = { Key: key, ContentType: file.type, Body: file };

        lbl_time.text(new Date().toLocaleString());
        lbl_name.text(file.name);
        lbl_size.text(file.size + ' Bytes');

        return bucket
          .upload(params, (err, data) => {
            if (err || !data.Location) return resolve({ error: 'upload' });
            lbl_link.attr('href', data.Location).text(data.Location).removeClass('d-none');
            return resolve({ type: file.type, bucket: data.Bucket, key: data.Key, url: data.Location });
          })
          .on('httpUploadProgress', (evt) => {
            const downloadSize = evt.total;
            const percentComplete = evt.loaded / evt.total;
            const percent = Math.round(percentComplete * 100);
            prg_bar
              .attr('aria-valuemax', evt.total)
              .attr('aria-valuenow', evt.loaded)
              .css('width', percent + '%');
            prg_bar_lbl.text(percent + ' / 100 %');
            // console.log('Progress:', evt.loaded, '/', evt.total);
          });
      }).then((r) => {
        container.attr('data-status', r.error ? 'error' : 'success');
        scope_loader.load();
      });
    };

    const init = () => {
      $('html')
        .on('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
        })
        .on('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });

      overlay
        .on('dragenter', (e) => {
          e.stopPropagation();
          e.preventDefault();
        })
        .on('dragover', (e) => {
          e.stopPropagation();
          e.preventDefault();
          overlay.addClass('active');
        })
        .on('dragleave', (e) => {})
        .on('drop', (e) => {
          e.stopPropagation();
          e.preventDefault();
          overlay.removeClass('active');
          const files = e.originalEvent.target.files || e.originalEvent.dataTransfer.files;
          Object.values(files).map((x) => {
            return __upload(x);
          });
        });
    };

    scope_uploader.init = init;
  })();

  return scope_aws.init().then((e) => {
    const global_status_init = global_status.find('.init');
    if (e && e.error) return global_status_init.text(JSON.stringify(e.error));
    global_status_init.text(global_status_init.attr('data-text'));
    scope_uploader.init();
    scope_loader.init();
  });
});
