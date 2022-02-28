import './home.less';

$(() => {
    const overlay = $(".overlay");
    const global_status = $(".global-status");

    let bucket;

    // init aws sdk
    const init_aws = () => {
        return $.when(
            $.get("/aws-config"),
            $.getScript('https://sdk.amazonaws.com/js/aws-sdk-2.283.1.min.js'),
        ).then((r) => {
            const aws = r[0];
            AWS.config.region = aws.region;
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({IdentityPoolId: aws.identity});
            AWS.config.credentials.get((e) => {
                if (e) return {error: e};
            });
            bucket = new AWS.S3({params: {Bucket: aws.bucketName}});
            return;
        });
    };

    const init_events = () => {
        $("html").on("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();
        }).on("drop", (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        overlay.on('dragenter', (e) => {
            e.stopPropagation();
            e.preventDefault();
        }).on('dragover', (e) => {
            e.stopPropagation();
            e.preventDefault();
            overlay.addClass("active");
        }).on('dragleave', (e) => {
        }).on('drop', (e) => {
            e.stopPropagation();
            e.preventDefault();
            overlay.removeClass("active");
            const files = e.originalEvent.target.files || e.originalEvent.dataTransfer.files;
            Object.values(files).map((x) => {return upload(x)});
        });
    };

    const upload = (file) => {
        const container = $(".upload-status-template").clone();
        container.insertAfter($(".upload-status-template"));
        container.removeClass("upload-status-template d-none");

        const prg_wrp = container.find('.progress');
        const prg_bar = prg_wrp.find('.progress-bar');
        const prg_bar_lbl = prg_wrp.find("small");

        const lbl_time = container.find(".time");
        const lbl_name = container.find(".name");
        const lbl_size = container.find(".size");
        const lbl_link = container.find(".link");

        container.attr("data-status", "uploading");

        return new Promise((resolve) => {
            if (!file) return resolve({error: "file"});

            const key = 'folder/' + new Date().getTime() + '_' + file.name.replace(/ /gi, "-");
            const params = {Key: key, ContentType: file.type, Body: file};

            lbl_time.text(new Date().toLocaleString());
            lbl_name.text(file.name);
            lbl_size.text(file.size + " Bytes");

            return bucket.upload(params, (err, data) => {
                if (err || !data.Location) return resolve({error: 'upload'});
                lbl_link.attr("href", data.Location).text(data.Location).removeClass("d-none");
                return resolve({type: file.type, bucket: data.Bucket, key: data.Key, url: data.Location});
            }).on('httpUploadProgress', (evt) => {
                const downloadSize = evt.total;
                const percentComplete = evt.loaded / evt.total;
                const percent = Math.round(percentComplete * 100);
                prg_bar.attr('aria-valuemax', evt.total).attr('aria-valuenow', evt.loaded).css('width', percent + '%');
                prg_bar_lbl.text(percent + ' / 100 %');
                // console.log('Progress:', evt.loaded, '/', evt.total);
            });
        }).then((r) => {
            container.attr("data-status", r.error ? "error" : "success");
        });
    };

    return init_aws().then((e) => {
        const global_status_init = global_status.find(".init");
        if (e && e.error) return global_status_init.text(JSON.stringify(e.error));
        global_status_init.text(global_status_init.attr("data-text"));
        init_events();
    });
});