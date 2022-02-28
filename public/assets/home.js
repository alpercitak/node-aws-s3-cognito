import './home.less';

const FOLDER_PREFIX = "folder/";

$(() => {
    const overlay = $(".overlay");
    const global_status = $(".global-status");
    const items_container = $(".items-container");
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
            bucket = new AWS.S3({params: {Bucket: aws.bucketName, Prefix: FOLDER_PREFIX}});
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

        items_container.find("a[data-action=load]").on("click", () => {
            load_items();
        });

        items_container.find("a[data-action=filter]").on("click", () => {
            items_container.find("[data-header=filter]").toggleClass("d-none");
        });

        items_container.find("input").on("keyup", (e) => {
            const value = items_container.find("input").val();
            const rows = items_container.find("[data-row]");

            rows.each(function () {
                const value_this = $(this).text();
                if (value && !value_this.includes(value)) $(this).addClass("d-none");
                else $(this).removeClass("d-none");
            });
        });
    };

    const load_items = () => {
        const header = items_container.find("[data-header]");
        const header_span = header.find("span");

        items_container.find("div:not([data-header])").remove();
        items_container.css("opacity", ".3");

        bucket.listObjects((e, d) => {
            d.Contents.map((x) => {
                items_container.append(`<div data-row>${x.Key}</div>`);
            });
            header_span.text(header_span.attr("data-text") + ` (${d.Contents.length})`);
            items_container.css("opacity", "1");
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

            const key = FOLDER_PREFIX + new Date().getTime() + '_' + file.name.replace(/ /gi, "-");
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
            load_items();
        });
    };

    return init_aws().then((e) => {
        const global_status_init = global_status.find(".init");
        if (e && e.error) return global_status_init.text(JSON.stringify(e.error));
        global_status_init.text(global_status_init.attr("data-text"));
        init_events();
        load_items();
    });
});