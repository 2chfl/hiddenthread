// ==UserScript==
// @name         HiddenThread
// @version      0.2
// @description  steganography for 2ch.hk
// @author       anon25519
// @include      *://2ch.*
// @grant        none
// @run-at       document-end
// ==/UserScript==

const BLOCK_SIZE = 16;
const IV_SIZE = 16;
const PUBLIC_KEY_SIZE = 65;
const SIGNATURE_SIZE = 64;

const NORMAL_POST_TYPE = 0;
const SIGNED_POST_TYPE = 1;

const MESSAGE_MAX_LENGTH = 30000
const MAX_FILES_COUNT = 100;

const CURRENT_VERSION = "0.2";
const VERSION_SOURCE = "https://raw.githubusercontent.com/diademoff/hiddenthread/main/version.info";

/*!
Библиотеки:
https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.min.js

https://raw.githubusercontent.com/indutny/elliptic/43ac7f230069bd1575e1e4a58394a512303ba803/dist/elliptic.min.js

https://raw.githubusercontent.com/pigulla/mersennetwister/5a747d99ef0831e5d1ffddfdbb6ea70f539501d4/src/MersenneTwister.js
*/

var libs = [
    "https://cdn.rawgit.com/Stuk/jszip/master/dist/jszip.min.js",
    "https://cdn.rawgit.com/indutny/elliptic/43ac7f230069bd1575e1e4a58394a512303ba803/dist/elliptic.min.js",
    "https://cdn.rawgit.com/pigulla/mersennetwister/5a747d99ef0831e5d1ffddfdbb6ea70f539501d4/src/MersenneTwister.js"
];

// Добавить скрипты
for (let i = 0; i < libs.length; i++) {
    const lib = libs[i];

    var type = document.createAttribute("type");

    type.value = 'text/javascript';

    var src = document.createAttribute("src");
    src.value = lib;

    var scrpt = document.createElement("script");
    scrpt.setAttributeNode(type);
    scrpt.setAttributeNode(src);

    var head = document.getElementsByTagName("head")[0];
    head.appendChild(scrpt);
}


///////////////////////////////////////////////////////////////////////////////
// Misc

function arrayToBase64(arr) {
    let binary = '';
    let len = arr.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(arr[i]);
    }
    return window.btoa(binary);
}

function arrayToBase64url(byteArray) {
    return btoa(Array.from(new Uint8Array(byteArray)).map(val => {
        return String.fromCharCode(val);
    }).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
}

function base64urlToArray(b64urlstring) {
    return new Uint8Array(atob(b64urlstring.replace(/-/g, '+').replace(/_/g, '/')).split('').map(val => {
        return val.charCodeAt(0);
    }));
}


/*
https://gist.github.com/diafygi/90a3e80ca1c2793220e5/
*/
var BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var arrayToBase58 = function (B) {
    var d = [],   //the array for storing the stream of base58 digits
        s = "",   //the result string variable that will be returned
        j,        //the iterator variable for the base58 digit array (d)
        c,        //the carry amount variable that is used to overflow from the current base58 digit to the next base58 digit
        n;        //a temporary placeholder variable for the current base58 digit
    for (var i = 0; i < B.length; i++) { //loop through each byte in the input stream
        j = 0,                           //reset the base58 digit iterator
            c = B[i];                    //set the initial carry amount equal to the current byte amount
        s += c || s.length ^ i ? "" : 1; //prepend the result string with a "1" (0 in base58) if the byte stream is zero and non-zero bytes haven't been seen yet (to ensure correct decode length)
        while (j in d || c) {            //start looping through the digits until there are no more digits and no carry amount
            n = d[j];                    //set the placeholder for the current base58 digit
            n = n ? n * 256 + c : c;     //shift the current base58 one byte and add the carry amount (or just add the carry amount if this is a new digit)
            c = n / 58 | 0;              //find the new carry amount (floored integer of current digit divided by 58)
            d[j] = n % 58;               //reset the current base58 digit to the remainder (the carry amount will pass on the overflow)
            j++                          //iterate to the next base58 digit
        }
    }
    while (j--)        //since the base58 digits are backwards, loop through them in reverse order
        s += BASE58_ALPHABET[d[j]]; //lookup the character associated with each base58 digit
    return s          //return the final base58 string
}
function base58ToArray(S) { var d = [], b = [], i, j, c, n; for (i in S) { j = 0, c = BASE58_ALPHABET.indexOf(S[i]); if (c < 0) return undefined; c || b.length ^ i ? i : b.push(0); while (j in d || c) { n = d[j]; n = n ? n * 58 + c : c; c = n >> 8; d[j] = n % 256; j++ } } while (j--) b.push(d[j]); return new Uint8Array(b) };


/* Randomize array in-place using Durstenfeld shuffle algorithm */
// steps: [1, array.length - 1]
function shuffleArray(array, steps) {
    let end = array.length - 1 - steps;
    if (end < 0) end = 0;
    let mt = new MersenneTwister(1337);
    for (let i = array.length - 1; i > end; i--) {
        let j = Math.floor(mt.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function getShuffledIndexList(length, steps) {
    let arrayIndexList = new Array(length / 4 * 3);
    for (let i = 0, j = 0; i < length; i++) {
        // Skip alpha channel
        if ((i + 1) % 4 != 0) {
            arrayIndexList[j] = i;
            j++;
        }
    }
    shuffleArray(arrayIndexList, steps);
    return arrayIndexList;
}

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////
// AES

async function getKeyMaterial(password) {
    let enc = new TextEncoder();
    let key = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password), {
        name: "PBKDF2"
    },
        false, ["deriveBits", "deriveKey"]
    );
    return key;
}

async function getKey(password, salt) {
    let keyMaterial = await getKeyMaterial(password);
    let key = await window.crypto.subtle.deriveKey(
        {
            "name": "PBKDF2",
            salt: salt,
            "iterations": 1000,
            "hash": "SHA-256"
        },
        keyMaterial,
        {
            "name": "AES-CBC",
            "length": 256
        },
        true,
        ["encrypt", "decrypt"]
    );
    return key;
}

async function encrypt(password, data) {
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));
    const algorithm = {
        iv,
        name: 'AES-CBC',
    };

    // В качестве соли для пароля используется IV
    let key = await getKey(password, iv);
    const encryptedData = await window.crypto.subtle.encrypt(
        algorithm,
        key,
        data,
    );

    let res = new Uint8Array(iv.length + encryptedData.byteLength);
    res.set(iv);
    res.set(new Uint8Array(encryptedData), iv.length);
    return res;
}

async function decrypt(password, data, onlyFirstBlock) {
    let iv = data.subarray(0, IV_SIZE);
    const algorithm = {
        iv,
        name: 'AES-CBC',
    };

    let key = await getKey(password, iv);
    let encryptedData = onlyFirstBlock ?
        data.subarray(IV_SIZE, IV_SIZE + BLOCK_SIZE) :
        data.subarray(IV_SIZE);
    const decryptedData = await window.crypto.subtle.decrypt(
        algorithm,
        key,
        encryptedData,
    );
    return new Uint8Array(decryptedData);
}

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////
// ECC

function importPublicKeyArrayFromPrivateKey(privateKeyBase58) {
    // WebCrypto не умеет получать публичный ключ из приватного, поэтому используется elliptic.js
    try {
        let e = new elliptic.ec('p256')
        let publicKeyArray = e.keyFromPrivate(base58ToArray(privateKeyBase58)).getPublic().encode();
        return new Uint8Array(publicKeyArray);
    }
    catch (e) {
        throw new Error('Не удалось получить публичный ключ из приватного: ' + e + ' stack:\n' + e.stack);
    }
}

async function exportPrivateKey(privateKey) {
    let privateKeyJwk = await window.crypto.subtle.exportKey(
        "jwk",
        privateKey
    );
    return arrayToBase58(base64urlToArray(privateKeyJwk.d));
}

async function importPrivateKey(privateKeyBase58, isForSign = true) {
    async function importPrivateKeyImpl(privateKeyJwk) {
        return await window.crypto.subtle.importKey(
            "jwk",
            privateKeyJwk,
            {
                name: isForSign ? 'ECDSA' : 'ECDH',
                namedCurve: "P-256"
            },
            true,
            [isForSign ? 'sign' : 'deriveKey']
        );
    }

    let privateKey = null;
    let privateKeyJwk = {
        'crv': 'P-256',
        'd': arrayToBase64url(base58ToArray(privateKeyBase58)),
        'ext': true,
        'key_ops': [isForSign ? 'sign' : 'deriveKey'],
        'kty': 'EC',
        'x': '',
        'y': ''
    }

    try {
        privateKey = await importPrivateKeyImpl(privateKeyJwk);
    }
    catch (e) {
        // Если браузер не поддерживает импорт приватного ключа без публичного,
        // то генерируем его
        let publicKeyArray = importPublicKeyArrayFromPrivateKey(privateKeyBase58);
        privateKeyJwk.x = arrayToBase64url(publicKeyArray.subarray(1, 33));
        privateKeyJwk.y = arrayToBase64url(publicKeyArray.subarray(33));
        try {
            privateKey = await importPrivateKeyImpl(privateKeyJwk);
        }
        catch (e) {
            throw new Error('HiddenThread: не удалось импортировать приватный ключ: ' + e);
        }
    }
    return privateKey;
}

async function exportPublicKey(publicKey) {
    let publicKeyArray = await window.crypto.subtle.exportKey(
        "raw",
        publicKey
    );
    return arrayToBase58(new Uint8Array(publicKeyArray));
}

async function importPublicKey(publicKeyRaw, isForVerify = true) {
    let publicKey = await window.crypto.subtle.importKey(
        "raw",
        publicKeyRaw,
        {
            name: isForVerify ? "ECDSA" : "ECDH",
            namedCurve: "P-256"
        },
        true,
        [isForVerify ? 'verify' : '']
    );
    return publicKey;
}

async function generateKeyPair() {
    let keyPair = await window.crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256"
        },
        true,
        ["sign", "verify"]);

    let privateKey = await exportPrivateKey(keyPair.privateKey);
    let publicKey = await exportPublicKey(keyPair.publicKey);
    let pair = [privateKey, publicKey]
    return pair;
}

async function sign(privateKeyBase58, data) {
    let signature = await window.crypto.subtle.sign(
        {
            name: "ECDSA",
            hash: { name: "SHA-256" },
        },
        await importPrivateKey(privateKeyBase58),
        data
    );

    return new Uint8Array(signature);
}

async function verify(publicKey, signature, data) {
    let result = await window.crypto.subtle.verify(
        {
            name: "ECDSA",
            hash: { name: "SHA-256" },
        },
        await importPublicKey(publicKey),
        signature,
        data
    );

    return result;
}

async function deriveSecretKey(privateKeyBase58, publicKeyBase58) {
    let secret = await window.crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: await importPublicKey(base58ToArray(publicKeyBase58), false)
        },
        await importPrivateKey(privateKeyBase58, false),
        {
            name: "AES-CBC",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );

    let secretRaw = await window.crypto.subtle.exportKey('raw', secret);
    return arrayToBase58(new Uint8Array(secretRaw));
}

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////
// LSB steganography

// Порядок упаковки:
// color (RGB), x, y, channel bit(0..7)
function hideDataToArray(array, data) {
    let requiredSteps = data.length * 8;
    let arrayIndexList = getShuffledIndexList(array.length, requiredSteps);
    let arrayIndex = arrayIndexList.length - 1; // Идем назад, т.к. индексы перемешаны с конца
    let arrayBitIndex = 0;
    for (let dataIndex = 0; dataIndex < data.length; dataIndex++) {
        for (let bitIndex = 7; bitIndex >= 0; bitIndex--) {
            let bit = (data[dataIndex] >> bitIndex) & 1;
            array[arrayIndexList[arrayIndex]] &= ~(1 << arrayBitIndex); // Clear bit
            array[arrayIndexList[arrayIndex]] |= bit << arrayBitIndex; // Set bit
            arrayIndex--;
            if (!(arrayIndex < 0)) {
                continue;
            }
            arrayIndex = arrayIndexList.length - 1;
            arrayBitIndex++;
            if (arrayBitIndex == 8 && dataIndex < (data.length - 1)) {
                throw new Error('Не удалось вместить данные в контейнер, осталось ещё ' +
                    (data.length - dataIndex - 1) + ' из ' + data.length + ' байт');
            }
        }
    }
}

function extractDataFromArray(array, data) {
    let requiredSteps = data.length * 8;
    let arrayIndexList = getShuffledIndexList(array.length, requiredSteps);
    let arrayBitIndex = 0;
    let dataBitIndex = 7;
    let dataIndex = 0;
    let arrayIndex = arrayIndexList.length - 1; // Идем назад, т.к. индексы перемешаны с конца
    while (true) {
        let bit = (array[arrayIndexList[arrayIndex]] >> arrayBitIndex) & 1;
        data[dataIndex] |= bit << dataBitIndex;
        dataBitIndex--;
        if (dataBitIndex < 0) {
            dataBitIndex = 7;
            dataIndex++;
            if (dataIndex >= data.length) { return; }
        }

        arrayIndex--;
        if (arrayIndex < 0) {
            arrayIndex = arrayIndexList.length - 1;
            arrayBitIndex++;
            if (arrayBitIndex == 8) {
                throw new Error('Неожиданный конец контейнера, ожидалось ещё ' +
                    (data.length - dataIndex) + ' из ' + data.length + ' байт');
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////



async function hideDataToImage(file, data) {
    let imageBitmap = await createImageBitmap(file);
    let rgbCount = imageBitmap.width * imageBitmap.height * 3;
    if (rgbCount < data.length) {
        let rest = Math.ceil((data.length - rgbCount) / 3);
        throw new Error('Невозможно вместить данные в контейнер, необходимо ещё ' +
            'как минимум ' + rest + ' пикселей. Выбери картинку с большим разрешением.');
    }

    let canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    let ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    hideDataToArray(imageData.data, data);
    ctx.putImageData(imageData, 0, 0);

    let percent = (data.length / (imageData.data.length / 4 * 3) * 100).toFixed(2);
    return { 'canvas': canvas, 'len': data.length, 'percent': percent };
}

function createHeader(type, totalLength) {
    let header = new Uint8Array(BLOCK_SIZE);
    header.set(new TextEncoder().encode('ht'));
    let version = 0x01;
    header[2] = version & 0xFF;
    header[3] = (version >> 8) & 0xFF;
    let blocksCount = Math.ceil((BLOCK_SIZE + totalLength + 1) / BLOCK_SIZE);
    header[4] = blocksCount & 0xFF;
    header[5] = (blocksCount >> 8) & 0xFF;
    header[6] = (blocksCount >> 16) & 0xFF;
    header[7] = (blocksCount >> 24) & 0xFF;
    let time = Math.ceil(new Date().getTime() / 1000);
    header[8] = time & 0xFF;
    header[9] = (time >> 8) & 0xFF;
    header[10] = (time >> 16) & 0xFF;
    header[11] = (time >> 24) & 0xFF;
    header[12] = type;
    header[15] = 0x01; // PKCS#7 padding

    return header;
}

async function packPost(message, files, privateKey) {
    let zip = new JSZip();
    zip.file("_post.txt", message);
    for (let i = 0; i < files.length; i++) {
        let f = files[i];
        zip.file(f.name, f);
    }

    let archive = await zip.generateAsync({
        type: "uint8array",
        compression: "DEFLATE",
        compressionOptions: {
            level: 6 // [1..9]
        }
    });

    let data = null;
    // Если указан приватный ключ, подписываем пост
    if (privateKey.length > 0) {
        let header = createHeader(SIGNED_POST_TYPE, PUBLIC_KEY_SIZE + SIGNATURE_SIZE + archive.length);
        let publicKeyArray = importPublicKeyArrayFromPrivateKey(privateKey);

        data = new Uint8Array(BLOCK_SIZE + PUBLIC_KEY_SIZE + SIGNATURE_SIZE + archive.length);
        data.set(header);
        data.set(publicKeyArray, BLOCK_SIZE);
        // Сигнатура будет вставлена после подписывания поста
        data.set(archive, BLOCK_SIZE + PUBLIC_KEY_SIZE + SIGNATURE_SIZE);

        let signatureArray = await sign(privateKey, data);
        if (signatureArray.length != SIGNATURE_SIZE || publicKeyArray.length != PUBLIC_KEY_SIZE) {
            console.log(signatureArray);
            console.log(publicKeyArray);
            throw new Error("signatureArray or publicKeyArray size incorrect");
        }
        data.set(signatureArray, BLOCK_SIZE + PUBLIC_KEY_SIZE);
    }
    else {
        let header = createHeader(NORMAL_POST_TYPE, archive.length);
        data = new Uint8Array(header.length + archive.length);
        data.set(header);
        data.set(archive, header.length);
    }

    return data;
}

async function createHiddenPostImpl(image, message, files, password, privateKey, otherPublicKey) {
    let oneTimePublicKey = null;
    if (otherPublicKey.length > 0) {
        // Создаем одноразовую пару ключей
        let pair = await generateKeyPair();
        // Генерируем секрет с одноразовым приватным ключом и публичным ключом получателя
        password = await deriveSecretKey(pair[0], otherPublicKey)
        // Получатель сгенерирует секрет нашим одноразовым публичным ключом и своим приватным
        oneTimePublicKey = base58ToArray(pair[1]);
    }

    let postData = await packPost(message, files, privateKey);

    let encryptedData = await encrypt(password, postData);

    if (oneTimePublicKey != null) {
        // Вставляем одноразовый ключ в начало массива данных
        let keyAndData = new Uint8Array(oneTimePublicKey.length + encryptedData.length);
        keyAndData.set(oneTimePublicKey);
        keyAndData.set(encryptedData, oneTimePublicKey.length);
        encryptedData = keyAndData;
    }

    let imageResult = await hideDataToImage(image, encryptedData);

    return imageResult;
}

function createHiddenPost() {
    let imageContainerDiv = document.getElementById('imageContainerDiv');
    imageContainerDiv.innerHTML = '';

    let containers = document.getElementById('hiddenContainerInput').files;

    if (containers.length == 0) {
        alert('Выбери картинку-контейнер!');
        return;
    }

    if (containers[0].type != 'image/png' &&
        containers[0].type != 'image/jpeg') {
        alert('Выбранный файл должен быть JPG или PNG картинкой!');
        return;
    }

    createHiddenPostImpl(containers[0],
        document.getElementById('hiddenPostInput').value,
        document.getElementById('hiddenFilesInput').files,
        document.getElementById('hiddenThreadPassword').value,
        document.getElementById('privateKey').value,
        document.getElementById('otherPublicKey').value)
        .then(function (imageResult) {
            let img = document.createElement('img');
            img.style = "max-width: 100%; max-height: 100%;";
            img.src = imageResult.canvas.toDataURL("image/png");

            imageContainerDiv.appendChild(createElementFromHTML('<span>Сохрани изображение ниже и вставь в форму отправки, если оно не вставилось автоматически:</span>'));
            imageContainerDiv.appendChild(document.createElement('br'));
            imageContainerDiv.appendChild(img);

            imageResult.canvas.toBlob(function (blob) {
                blob.name = getFileName();
                window.FormFiles.addMultiFiles([blob]);
            });

            alert('Спрятано ' + imageResult.len + ' байт (занято ' + imageResult.percent + '% изображения)');
        })
        .catch(function (e) {
            console.log('Ошибка при создании скрытопоста: ' + e + ' stack:\n' + e.stack);
            alert('Ошибка при создании скрытопоста: ' + e);
        });
}

function createFileLinksDiv(files) {
    let fileLinksDiv = document.createElement('div');
    if (files.length == 0) {
        return fileLinksDiv;
    }

    fileLinksDiv.innerHTML += 'Файлы: ';
    for (let i = 0; i < files.length; i++) {
        let link = document.createElement('a');
        link.target = "_blank";
        link.innerText = files[i].name;
        link.href = URL.createObjectURL(files[i].data);
        fileLinksDiv.appendChild(link);
        fileLinksDiv.innerHTML += ' ';

        let downloadLink = document.createElement('a');
        downloadLink.download = files[i].name;
        downloadLink.innerText = '\u2193';
        downloadLink.href = URL.createObjectURL(files[i].data);
        fileLinksDiv.appendChild(downloadLink);

        if (i < files.length - 1) {
            fileLinksDiv.innerHTML += ', ';
        }
    }
    return fileLinksDiv;
}

// Добавление HTML скрытопоста к основному посту
function addHiddenPostToHtml(postId, postResult) {
    console.log(`HiddenThread: Post ${postId} is hidden, its object:`);
    console.log(postResult);
    let postBodyDiv = document.createElement('div');
    postBodyDiv.id = 'hidden_post-body-' + postId;
    postBodyDiv.classList.add("post");
    postBodyDiv.classList.add("post_type_reply");
    postBodyDiv.setAttribute('data-num', String(postId));

    let postMetadata = document.createElement('div');
    postMetadata.style = 'font-family: courier new;';
    let postArticle = document.createElement('article');
    postArticle.id = 'hidden_m' + postId;
    postArticle.classList.add("post__message");

    let postArticleMessage = document.createElement('div');
    postArticleMessage.innerText = postResult.post.message;

    if (postResult.isPrivate) {
        postMetadata.appendChild(createElementFromHTML('<div style="color:orange;"><i>Этот пост виден только с твоим приватным ключом</i></div>'));
    }
    let timeString = (new Date(postResult.header.timestamp * 1000))
        .toISOString().replace('T', ' ').replace(/\.\d+Z/g, '');
    postMetadata.appendChild(createElementFromHTML('<div>Дата создания скрытопоста (UTC): ' + timeString + '</div>'));
    postMetadata.appendChild(createFileLinksDiv(postResult.post.files));

    if (postResult.verifyResult != null) {
        let postArticleSign = document.createElement('div');
        postArticleSign.innerHTML =
            'Публичный ключ: <span ' +
            (postResult.verifyResult.isVerified ? 'style="color:green;"' : 'style="color:red;"') + '>' +
            postResult.verifyResult.publicKey + '</span>' +
            (postResult.verifyResult.isVerified ? '' : ' (неверная подпись!)');
        postMetadata.appendChild(postArticleSign);
    }
    postArticle.appendChild(postMetadata);
    postArticle.appendChild(document.createElement('br'));
    postArticle.appendChild(postArticleMessage);

    let postRefsDiv = document.createElement('div');
    postRefsDiv.id = 'hidden_refmap-' + postId;
    postRefsDiv.classList.add("post__refmap");
    postRefsDiv.style = 'display: block;';

    postBodyDiv.appendChild(postArticle);
    postBodyDiv.appendChild(postRefsDiv);

    let clearPost = document.getElementById('post-' + postId);
    clearPost.appendChild(document.createElement('br'));
    clearPost.appendChild(postBodyDiv);
}

// Добавление HTML скрытопоста в объект основного поста (для всплывающих постов)
function addHiddenPostToObj(postId) {
    let thread = window.Post(window.thread.id);
    let currentPost = thread.getPostsObj()[String(postId)];
    let postArticle = document.getElementById('hidden_m' + postId);
    currentPost.ajax.comment = currentPost.ajax.comment + '<br>' + postArticle.innerHTML;
}

function createElementFromHTML(htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstElementChild;
}

function createReplyLink(postId) {
    let threadId = window.thread.id;
    return '<a href="/' + window.board + '/res/' + threadId + '.html#' + postId +
        '" class="post-reply-link" data-thread="' + threadId + '" data-num="' + postId +
        '">&gt;&gt;' + postId + '</a>';
}

function addReplyLinks(postId, text) {
    let thread = window.Post(window.thread.id);
    let postArticle = document.getElementById('hidden_m' + postId);

    let linkRegex = '&gt;&gt;(\\d{1,10})';
    const linkMatches = postArticle.innerHTML.matchAll(linkRegex);

    let refPostIdSet = new Set();
    let indexDiff = 0;
    for (const match of linkMatches) {
        let refPostId = match[1];

        // Добавление ссылки на другой пост (замена текста ">>..." на ссылку) в HTML
        let replyStr = createReplyLink(refPostId);
        let oldLength = '&gt;&gt;'.length + refPostId.length;
        postArticle.innerHTML = postArticle.innerHTML.substr(0, match.index + indexDiff) + replyStr +
            postArticle.innerHTML.substr(match.index + indexDiff + oldLength);
        indexDiff += replyStr.length - oldLength;

        if (!refPostIdSet.has(refPostId)) {
            refPostIdSet.add(refPostId);
            // Добавление ссылки на текущий пост в ответы другого поста
            // В HTML:
            let refPostRefs =
                document.getElementById('hidden_refmap-' + refPostId) ||
                document.getElementById('refmap-' + refPostId);
            if (refPostRefs != null) {
                refPostRefs.style = "display: block;";
                refPostRefs.appendChild(createElementFromHTML(createReplyLink(postId)));

                // В Object (для всплывающих постов):
                let refPost = thread.getPostsObj()[refPostId];
                if (refPost) {
                    if (refPost.replies == undefined) {
                        refPost.replies = new Array();
                    }
                    refPost.replies.push(postId);
                }
            }
        }
    }
}

function renderHiddenPost(postId, postResult) {
    addHiddenPostToHtml(postId, postResult);
    addReplyLinks(postId, postResult.post.message);
    addHiddenPostToObj(postId); // Текст скрытопоста берется из HTML
}

async function unzipPostData(zipData) {
    let zip = new JSZip();

    let postMessage = '';
    let files = [];
    let filesCount = 0;
    try {
        let archive = await zip.loadAsync(zipData);

        for (const filename in archive.files) {
            filesCount++;
            if (filesCount > MAX_FILES_COUNT) break;

            if (filename == '_post.txt') {
                postMessage = await archive.file(filename).async('string');
                if (postMessage.length > MESSAGE_MAX_LENGTH) {
                    postMessage = postMessage.substring(0, MESSAGE_MAX_LENGTH) +
                        '...(часть сообщения обрезана, смотри файл ' + filename + ')';
                    let postMessageFileData = await archive.file(filename).async('blob');
                    files.push({ 'name': filename, 'data': postMessageFileData });
                }
            }
            else {
                let fileData = await archive.file(filename).async('blob');
                files.push({ 'name': filename, 'data': fileData });
            }
        }
    }
    catch (e) {
        console.log('HiddenThread: Ошибка при распаковке архива: ' + e + ' stack:\n' + e.stack);
    }

    return { 'message': postMessage, 'files': files };
}

async function verifyPostData(data) {
    let keySigPair = [data.subarray(BLOCK_SIZE, BLOCK_SIZE + PUBLIC_KEY_SIZE),
    // Копируем сигнатуру
    new Uint8Array(data.subarray(BLOCK_SIZE + PUBLIC_KEY_SIZE,
        BLOCK_SIZE + PUBLIC_KEY_SIZE + SIGNATURE_SIZE))];

    // Обнуляем поле с сигнатурой, чтобы получить корректный хэш при проверке
    data.set(new Uint8Array(SIGNATURE_SIZE), BLOCK_SIZE + PUBLIC_KEY_SIZE);

    let isVerified = false;
    try {
        isVerified = await verify(keySigPair[0], keySigPair[1], data);
    }
    catch (e) {
        console.log('HiddenThread: Ошибка при проверке подписи: ' + e + ' stack:\n' + e.stack);
    }
    let verifyResult = {
        'publicKey': arrayToBase58(keySigPair[0]),
        'signature': arrayToBase58(keySigPair[1]),
        'isVerified': isVerified
    };
    return verifyResult;
}

function parseHeader(header) {
    return {
        'magic': new TextDecoder().decode(header.subarray(0, 2)),
        'version': header[2] + (header[3] << 8),
        'blocksCount': header[4] + (header[5] << 8) + (header[6] << 16) + (header[7] << 24),
        'timestamp': header[8] + (header[9] << 8) + (header[10] << 16) + (header[11] << 24),
        'type': header[12]
    };
}

async function decryptData(password, imageArray, dataOffset) {
    // Извлекаем IV и первый блок AES
    let hiddenDataHeader = new Uint8Array(dataOffset + IV_SIZE + BLOCK_SIZE);
    extractDataFromArray(imageArray, hiddenDataHeader);
    hiddenDataHeader = hiddenDataHeader.subarray(dataOffset);
    let dataHeader = null;
    try {
        dataHeader = await decrypt(password, hiddenDataHeader, true);
    }
    catch (e) {
        //console.log('Не удалось расшифровать заголовок, либо неверный пароль, либо это не скрытопост: ' + e);
        return null;
    }

    let header = parseHeader(dataHeader);
    if (header.magic != 'ht') {
        console.log('HiddenThread: Неверная сигнатура: ' + header.magic);
        return null;
    }

    console.log('HiddenThread: version ' + header.version);
    console.log('HiddenThread: blocksCount ' + header.blocksCount);
    console.log('HiddenThread: timestamp ' + header.timestamp);
    console.log('HiddenThread: type ' + header.type);

    let maxHiddenDataLength = imageArray.length / 4 * 3;
    let hiddenDataLength = IV_SIZE + header.blocksCount * BLOCK_SIZE;
    console.log('HiddenThread: hiddenDataLength (+IV) ' + hiddenDataLength);
    if (hiddenDataLength > maxHiddenDataLength) {
        console.log('HiddenThread: blocksCount * BLOCK_SIZE: ' + (header.blocksCount * BLOCK_SIZE) + ' > maxHiddenDataLength: ' + maxHiddenDataLength);
        return null;
    }

    // Заголовок верный, расшифровываем остальной пост
    let hiddenData = new Uint8Array(dataOffset + hiddenDataLength);
    extractDataFromArray(imageArray, hiddenData);
    hiddenData = hiddenData.subarray(dataOffset);

    let decryptedData = null;
    try {
        decryptedData = await decrypt(password, hiddenData);
    }
    catch (e) {
        //console.log('HiddenThread: Не удалось расшифровать данные: ' + e);
        return null;
    }
    return {
        'header': header,
        'data': decryptedData
    };
}

/*
Возвращает объект скрытого поста.
Объект:
{
  "header": {
    "magic": "ht",
    "version": 1,
    "blocksCount": 9,
    "timestamp": 1623775315,
    "type": 0
  },
  "post": {
    "message": "test",
    "files": []
  },
  "verifyResult": null,
  "isPrivate": false
}
*/
async function loadPostFromImage(img, password, privateKey) {
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Пробуем расшифровать как публичный пост
    let isPrivate = false;
    let decryptedData = await decryptData(password, imageData.data, 0);
    if (decryptedData == null && privateKey.length > 0) {
        isPrivate = true;
        // Извлекаем одноразовый публичный ключ
        let hiddenOneTimePublicKey = new Uint8Array(PUBLIC_KEY_SIZE);
        extractDataFromArray(imageData.data, hiddenOneTimePublicKey);
        // Генерируем секрет с одноразовым публичным ключом отправителя и своим приватным ключом
        let oneTimePublicKey = arrayToBase58(hiddenOneTimePublicKey);

        let secretPassword = null
        try {
            secretPassword = await deriveSecretKey(privateKey, oneTimePublicKey);
        }
        catch (e) {
            // console.log('HiddenThread: Не удалось сгенерировать секрет: ' + e);
        }

        if (secretPassword != null) {
            // Пробуем расшифровать как приватный пост
            decryptedData = await decryptData(secretPassword, imageData.data, PUBLIC_KEY_SIZE);
        }
    }

    // Расшифровать не получилось
    if (decryptedData == null) return null;

    let zipOffset = null;
    let verifyResult = null;
    if (decryptedData.header.type == SIGNED_POST_TYPE) {
        verifyResult = await verifyPostData(decryptedData.data);
        zipOffset = BLOCK_SIZE + PUBLIC_KEY_SIZE + SIGNATURE_SIZE;
    }
    else {
        zipOffset = BLOCK_SIZE;
    }

    let post = await unzipPostData(decryptedData.data.subarray(zipOffset));

    return {
        'header': decryptedData.header,
        'post': post,
        'verifyResult': verifyResult,
        'isPrivate': isPrivate,
    };
}

/* Перепроверить все посты */
function reloadHiddenPosts() {
    window.gLoadedHiddenPosts = new Set();

    /* Посты обновятся основным циклом */
}

/*
Проверяет есть ли в этом посте скрытый пост, расшифровывает
и выводит результат
*/
function loadPost(postId, file_url) {
    let img = new Image();
    img.onload = (function () {
        console.log('HiddenThread: loading post ' + postId + ' ' + file_url);

        loadPostFromImage(img,
            document.getElementById('hiddenThreadPassword').value,
            document.getElementById('privateKey').value)
            .then(function (postResult) {
                if (postResult == null) return;
                renderHiddenPost(postId, postResult);
                window.gLoadedHiddenPosts.add(postId);
            });
    });
    img.setAttribute("src", file_url);
}

function getFileName() {
    fileTyped = document.getElementById('fileName').value;

    if (!fileTyped) {
        return "image.png";
    }

    return fileTyped.endsWith('.png') ? fileTyped : `${fileTyped}.png`
}

function CheckVersion() {
    var request = new XMLHttpRequest();
    s = "https://raw.githubusercontent.com/diademoff/hiddenthread/main/README.md";
    request.open("GET", s);
    request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status === 200) {
        console.log(`Актуальная версия: ${request.responseText}`);
        if( CURRENT_VERSION === request.responseText){
            document.getElementById('versionInfo').style = "color: green";
            document.getElementById('versionInfo').textContent = "У вас актуальная версия скрипта";
        }else{
            document.getElementById('versionInfo').style = "color: red";
            document.getElementById('versionInfo').textContent = "Ваша версия скрипта устарела";
        }
    }
    };
    request.send(null); // Send the request now
}


function createInterface() {
    let hiddenPostDiv = document.createElement('div');
    hiddenPostDiv.id = 'hiddenPostDiv';
    hiddenPostDiv.innerHTML =
        '<hr>' +
        '    <div style="font-size:x-large;text-align:center;">Скрытотред v0.2</div>' +
        '    <div style="padding:5px;display: flex; justify-content: center;">' +
        '        <input id="reloadHiddenPostsButton" type="button" style="padding: 5px;" value="Перезагрузить скрытопосты">' +
        '    </div>' +
        `   <div style="display: flex; justify-content: left; align-items: center; flex-direction: row; margin-bottom: 5px;">
                <span style="padding-right: 5px;">Пароль:</span>
                <input id="hiddenThreadPassword">
                <a target="_blank" style="font-size: small; margin-left: 5px" href="https://github.com/diademoff/hiddenthread">?</a>
            </div>` +
        '    <textarea id="hiddenPostInput" placeholder="Пиши скрытый текст тут" style="box-sizing: border-box; display: inline-block; width: 100%; padding: 5px;" rows="10"></textarea>' +
        '    <div id="hiddenFilesDiv" style="padding: 5px;">' +
        '        <span>Выбери скрытые файлы: </span>' +
        '        <input id="hiddenFilesInput" type="file" multiple="true">' +
        '        <br>' +
        '        <span>Выбери картинку-контейнер: </span>' +
        '        <input id="hiddenContainerInput" type="file">' +
        `        <div style="display: flex; justify-content: left; align-items: center; flex-direction: row; margin: 5px; 0">
                 <span style="margin-right: 5px">Имя картинки:</span>
                 <input id="fileName">
                </div>` +
        '        <input id="hiddenFilesClearButton" type="button" value="Очистить список файлов">' +
        '    </div>' +
        '    <div style="padding: 5px;">' +
        '        <div style="font-size:large;text-align:center;">Подписать пост</div>' +
        '        Приватный ключ (ECDSA p256, base58): <br>' +
        '        <input id="privateKey" style="box-sizing: border-box; display: inline-block; width: 100%; padding: 5px;">' +
        '        <br>' +
        '        Публичный ключ: <br>' +
        '        <input id="publicKey" readonly style="box-sizing: border-box; display: inline-block; width: 100%; padding: 5px;">' +
        '        <br>' +
        '        <div align="center" style="margin-top: 8px">' +
        '            <input id="generateKeyPairButton" type="button" style="padding: 5px;" value="Сгенерировать ключи">' +
        '        </div>' +
        '    </div>' +
        '    <div style="padding: 5px;">' +
        '        <div style="font-size:large;text-align:center;">Приватный пост</div>' +
        '        Публичный ключ получателя: <br>' +
        '        <input id="otherPublicKey" style="box-sizing: border-box; display: inline-block; width: 100%; padding: 5px;">' +
        '    </div>' +
        '    <br>' +
        '    <div align="center">' +
        '        <input id="createHiddenPostButton" type="button" value="Создать картинку со скрытопостом" style="padding: 5px;">' +
        '    </div>' +
        '    <div id="imageContainerDiv"></div>' +
        `    <div style="display: flex; justify-content: center;">
                <span id="versionInfo"></span>
             </div>` +
        '    <hr>';

    document.getElementById('postform').appendChild(hiddenPostDiv);

    document.getElementById('reloadHiddenPostsButton').onclick = function () {
        reloadHiddenPosts();
    }
    document.getElementById('hiddenFilesClearButton').onclick = function () {
        document.getElementById('hiddenFilesInput').value = null;
    }
    document.getElementById('createHiddenPostButton').onclick = function () {
        createHiddenPost();
    }
    document.getElementById('generateKeyPairButton').onclick = function () {
        generateKeyPair()
            .then(function (pair) {
                document.getElementById('privateKey').value = pair[0];
                document.getElementById('publicKey').value = pair[1];
            });
    }
    document.getElementById('privateKey').oninput = function () {
        let privateKey = document.getElementById('privateKey').value;
        let publicKeyArray = null;
        try {
            publicKeyArray = importPublicKeyArrayFromPrivateKey(privateKey);
        }
        catch (e) { }

        if (publicKeyArray && publicKeyArray.length > 0) {
            document.getElementById('publicKey').value = arrayToBase58(publicKeyArray);
        }
        else {
            document.getElementById('publicKey').value = '';
        }
    }
}

createInterface();

/* Отслеживание новых постов */

if (window.gLoadedHiddenPosts == undefined) {
    // Список id всех просмотренных постов
    window.gLoadedHiddenPosts = new Set();
}

// Выбираем элемент
var target = document.querySelector('#posts-form');

target.addEventListener("DOMNodeInserted", function (event) {
    // works like while-true loop
    let threadId = window.thread.id;
    let thread = window.Post(threadId);
    let postIdList = thread.threadPosts();

    for (let i = 0; i < postIdList.length; i++) {
        const post_id = postIdList[i];
        if (window.gLoadedHiddenPosts.has(post_id)) {
            continue;
        }

        let postAjax = thread.getPostsObj()[String(postIdList[i])].ajax;
        if (!postAjax) continue;

        let postFiles = postAjax.files;
        if (!(postFiles.length > 0 && postFiles[0].path.endsWith('.png'))) {
            window.gLoadedHiddenPosts.add(post_id);
            continue;
        }

        let url = postFiles[0].path;
        let postId = postIdList[i];
        loadPost(postId, url);

        window.gLoadedHiddenPosts.add(post_id);
    }
}, false);

CheckVersion();