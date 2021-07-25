function Tele(token) {
    this.api = "https://api.telegram.org/bot";
    this.token = token;
    this.last = null;
    this.res = null;
    self = this;
    let listenForMessage = [];
    let callFunctions = [];

    let listenForHas = [];
    let hasFunctions = [];

    let listenForStart = [];
    let startFunctions = [];

    let listenForPhoto = false;
    let listenForContact = false;
    let listenForFile = false;
    let listenForVoice = false;
    let listenForAllMessage = false;

    let url = this.api + this.token;

    function ajax(json) {
        var data = json;
        var url = data.url;
        var type = data.type;
        var params = data.params.toString();

        if (window.XMLHttpRequest) {
            // code for modern browsers
            xh = new XMLHttpRequest();
        } else {
            // code for old IE browsers
            xh = new ActiveXObject("Microsoft.XMLHTTP");
        }

        if (type.toLowerCase() == "get") {
            xh.open(type, url, true);
            xh.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xh.send();
        } else if (type.toLowerCase() == "post") {
            xh.open(type, url, true);
            xh.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xh.send(params);
        } else {
            throw ("Can only take GET and POST");
        }
        xh.onload = function() {
            if (xh.status == 200) {
                if (data.success != undefined) {
                    data.success(xh.responseText);
                }
            }
        }
        xh.onerror = function() {
            if (data.error != undefined) {
                data.error(xh.responseText);
            }
        }
    }

    async function poll() {
        let response;
        if(self.last != null){
            response = await fetch(url + "/getUpdates?offset="+(self.last));
        }else{
            response = await fetch(url + "/getUpdates");
        }

        if (response.status == 502) {
            // Status 502 is a connection timeout error,
            // may happen when the connection was pending for too long,
            // and the remote server or a proxy closed it
            // let's reconnect
            await poll();
        } else if (response.status != 200) {
            // An error - let's show it
            console.warn(response.statusText);
            // Reconnect in one second
            await new Promise(resolve=>setTimeout(resolve, 1000));
            await poll();
        } else {
            // Get and show the message
            let message = await response.text();
            let json = JSON.parse(message);
            //console.log(json);
            if (self.last == null) {
                try{
                    self.last = json.result[json.result.length-1].update_id;
                }catch(e){

                }
            }
            if (json.result.length > 1) {
                let res = json.result[json.result.length - 1];
                self.res = res;
                //Set user details
                self.id = res.message.chat.id;
                self.first_name = res.message.chat.first_name;
                self.username = res.message.chat.username;
                self.type = res.message.chat.type;
                self.is_bot = res.message.from.is_bot;
                self.language_code = res.message.from.language_code;
                console.log(res);

                try{
                    if(Object.keys(res.message).includes("text")){
                        if(listenForMessage.indexOf(res.message.text) != -1) {
                            let index = listenForMessage.indexOf(res.message.text);
                            callFunctions[index](res.message);
                        }
                        listenForHas.forEach(function(has,i){
                            if(res.message.text.includes(has)){
                                hasFunctions[i](res.message);
                            }
                        });
                        listenForStart.forEach(function(start,i){
                            if(res.message.text.startsWith(start)){
                                startFunctions[i](res.message);
                            }
                        });
                        if(listenForAllMessage){
                            listenForAllMessage(res.message.text);
                        }
                    }
                    //listen and catch photos
                    if(Object.keys(res.message).includes("photo")){
                        if(listenForPhoto){
                            listenForPhoto(res.message.photo);
                        }
                    }
                    //listen and catch contact
                    if(Object.keys(res.message).includes("contact")){
                        if(listenForContact){
                            listenForContact(res.message.contact);
                        }
                    }
                    //listen and catch documents
                    if(Object.keys(res.message).includes("document")){
                        if(listenForFile){
                            listenForFile(res.message.document);
                        }
                    }
                    //listen and catch voice notes
                    if(Object.keys(res.message).includes("voice")){
                        if(listenForVoice){
                            listenForVoice(res.message.voice);
                        }
                    }
                    self.last = json.result[json.result.length-1].update_id;
                }catch(e){

                }
            }
        }
        // Call poll() again to get the next message
        await poll();
    }
    this.start = function() {
        try{
            poll();
        }catch(e){

        }
    }
    this.onMessage = function(message, callback) {
        listenForMessage.push(message);
        callFunctions.push(callback);
    }
    this.getMessage = function(callback){
        listenForAllMessage = callback;
    }
    this.onPhoto = function(callback){
        listenForPhoto = callback;
    }
    this.onContact = function(callback){
        listenForContact = callback;
    }
    this.onFile = function(callback){
        listenForFile = callback;
    }
    this.onVoice = function(callback){
        listenForVoice = callback;
    }
    this.onHasMessage = function(message, callback) {
        listenForHas.push(message);
        hasFunctions.push(callback);
    }
    this.onStartsMessage = function(message, callback) {
        listenForStart.push(message);
        startFunctions.push(callback);
    }
    this.reply = function(message) {
        let id = self.res.message.chat.id;
        let msg_id = self.res.message.message_id;
        ajax({
            url: url + `/sendMessage?chat_id=${id}&text=${encodeURI(message)}&reply_to_message_id=${msg_id}&parse_mode=MarkdownV2`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.sendMessage = function(id, message) {
        ajax({
            url: url + `/sendMessage?chat_id=${id}&text=${encodeURI(message)}&parse_mode=MarkdownV2`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.editMessage = function(message) {
        let id = self.id;
        let message_id = self.botLast.result.message_id;

        ajax({
            url: url + `/editMessageText?chat_id=${id}&message_id=${message_id}&text=${encodeURI(message)}&parse_mode=MarkdownV2`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.deleteMessage = function() {
        let message_id = self.botLast.result.message_id;
        let id = self.id;
        try{
            ajax({
                url: url + `/deleteMessage?chat_id=${id}&message_id=${message_id}`,
                type: "POST",
                params: "",
                error: function(res) {
                    console.error(res);
                }
            })
        }catch(e){

        }
    }
    this.sendPhoto = function(id, photoUrl) {
        ajax({
            url: url + `/sendPhoto?chat_id=${id}&photo=${photoUrl}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.sendAudio = function(id, audioUrl) {
        ajax({
            url: url + `/sendAudio?chat_id=${id}&audio=${audioUrl}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.sendDocument = function(id, documentUrl) {
        ajax({
            url: url + `/sendDocument?chat_id=${id}&document=${documentUrl}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.sendVideo = function(id, videoUrl) {
        ajax({
            url: url + `/sendVideo?chat_id=${id}&video=${videoUrl}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.forwardMessageTo = function(id) {
        let from_id = self.id;
        let msg_id = self.res.message.message_id;
        ajax({
            url: url + `/forwardMessage?chat_id=${id}&from_chat_id=${from_id}&message_id=${msg_id}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.copyMessageTo = function(id) {
        let from_id = self.id;
        let msg_id = self.res.message.message_id;
        ajax({
            url: url + `/copyMessage?chat_id=${id}&from_chat_id=${from_id}&message_id=${msg_id}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.sendChatAction = function(action) {
        let id = self.id;
        ajax({
            url: url + `/sendChatAction?chat_id=${id}&action=${action}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.sendTyping = function() {
        let id = self.id;
        ajax({
            url: url + `/sendChatAction?chat_id=${id}&action=typing`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.error(res);
            }
        })
    }
    this.getFile = function(file_id){
        function ajaxSync(json) {
            json = JSON.stringify(json);
            let res = "";
            var data = JSON.parse(json);
            var url = data.url;
            var type = data.type;
            var params = data.params.toString();

            if (window.XMLHttpRequest) {
                // code for modern browsers
                xh = new XMLHttpRequest();
            } else {
                // code for old IE browsers
                xh = new ActiveXObject("Microsoft.XMLHTTP");
            }

            xh.onload = function() {
                if (xh.status == 200) {
                    res = xh.responseText;
                }
            }
            xh.onerror = function(){
                res = false;
                return false;
            }
            if (type.toLowerCase() == "get") {
                xh.open(type, url, false);
                xh.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                try{
                    xh.send();
                }catch(e){
                    return false;
                }
            } else if (type.toLowerCase() == "post") {
                xh.open(type, url, false);
                xh.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xh.send(params);
            } else {
                throw ("Can only take GET and POST");
            }
            return res;
        }

        let response = ajaxSync({
            url: url + `/getFile?file_id=${file_id}`,
            type: "POST",
            params: "",
        });

        if(response){
            return "https://api.telegram.org/file/bot" + self.token + "/" + JSON.parse(response).result.file_path;
        }else{
            console.error("getFile failed :(");
        }

    }
}

try{
    module.exports = Tele;
}catch(e){
    
}