
/**
 * 
 */
function ImageLoader(url, callback, onProgress) {
    var image = document.createElement('img');
    image.crossOrigin = 'Anonymous';

    var onload = function () {
        if (callback) {
            callback(this);
        }
        image.removeEventListener('load', onload);
        image.removeEventListener('error', onerror);
        image.removeEventListener('progress', onProgress);
    };
    var onerror = function (msg, line, url) {
        if (callback) {
            var error = 'Failed to load image: ' + msg + ' Url: ' + url;
            callback(null, error);
        }
        image.removeEventListener('load', onload);
        image.removeEventListener('error', onerror);
        image.removeEventListener('progress', onProgress);
    };

    image.addEventListener('load', onload);
    image.addEventListener('error', onerror);
    if (onProgress) {
        image.addEventListener('progress', onProgress);
    }
    image.src = url;
    return image;
}

/**
 * @param {string} [responseType="text"] - the XMLHttpRequestResponseType
 */
function _LoadFromXHR(url, callback, onProgress, responseType) {
    var xhr = new XMLHttpRequest();
    //xhr.withCredentials = true;   // INVALID_STATE_ERR: DOM Exception 11 in phantomjs
    var total = -1;
    xhr.onreadystatechange = function () {
        if (xhr.readyState === xhr.DONE) {
            if (callback) {
                if (xhr.status === 200 || xhr.status === 0) {
                    callback(xhr);
                }
                else {
                    callback(null, 'LoadFromXHR: Could not load "' + url + '", status: ' + xhr.status);
                }
            }
            xhr.onreadystatechange = null;
            if (onProgressEventListener) {
                xhr.removeEventListener('progress', onProgressEventListener);
            }
        }
        if (onProgress && xhr.readyState === xhr.LOADING && !('onprogress' in xhr)) {
            if (total === -1) {
                total = xhr.getResponseHeader('Content-Length');
            }
            onProgress(xhr.responseText.length, total);
        }
        if (onProgress && xhr.readyState === xhr.HEADERS_RECEIVED) {
            total = xhr.getResponseHeader('Content-Length');
        }
    };
    xhr.open('GET', url, true);
    if (responseType) {
        xhr.responseType = responseType;
    }
    var onProgressEventListener;
    if (onProgress && 'onprogress' in xhr) {
        onProgressEventListener = function (event) {
            if (event.lengthComputable) {
                onProgress(event.loaded, event.total);
            }
        };
        xhr.addEventListener('progress', onprogress);
    }
    xhr.send();
}

function TextLoader(url, callback, onProgress) {
    var cb = callback && function(xhr, error) {
        if (xhr && xhr.responseText) {
            callback(xhr.responseText);
        }
        else {
            callback(null, 'LoadText: "' + url + 
                '" seems to be unreachable or the file is empty. InnerMessage: ' + error);
        }
    };
    _LoadFromXHR(url, cb, onProgress);
}
