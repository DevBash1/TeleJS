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
    let listenForGroupMessage = false;
    let listenForEditedMessage = false;
    let listenForNewMember = false;
    let listenForLeftMember = false;
    let listenForEvents = false;

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
            }else if(xh.status == 400){
                data.error(xh.responseText);
            }
        }
        xh.onerror = function() {
            if (data.error != undefined) {
                data.error(xh.responseText);
            }
        }
    }

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
                    self.last = json.result[1].update_id;
                }catch(e){
                    
                }
            }
            if (json.result.length > 1) {
                let res = json.result[1];
                self.res = res;

                //handle any events manually
                if(listenForEvents){
                    listenForEvents(res);
                }
                
                //Set user details
                if(Object.keys(res).includes("message")){
                    if(res.message.chat.type == "private"){
                        self.id = res.message.chat.id;
                        self.first_name = res.message.chat.first_name;
                        self.username = res.message.chat.username;
                        self.type = res.message.chat.type;
                        self.is_bot = res.message.from.is_bot;
                        self.language_code = res.message.from.language_code;
                    }else if(res.message.chat.type == "supergroup"){
                        self.id = res.message.chat.id;
                        self.group_name = res.message.chat.title;
                        self.group_username = res.message.chat.username;
                        self.type = res.message.chat.type;
                        self.is_bot = res.message.from.is_bot;
                        self.language_code = res.message.from.language_code;
                        self.first_name = res.message.from.first_name;
                        self.username = res.message.from.username;
                        self.user_id = res.message.from.id;
                    }
                }else if(Object.keys(res).includes("edited_message")){
                    if(res.edited_message.chat.type == "private"){
                        self.id = res.edited_message.chat.id;
                        self.first_name = res.edited_message.chat.first_name;
                        self.username = res.edited_message.chat.username;
                        self.type = res.edited_message.chat.type;
                        self.is_bot = res.edited_message.from.is_bot;
                        self.language_code = res.edited_message.from.language_code;
                    }else if(res.edited_message.chat.type == "supergroup"){
                        self.id = res.edited_message.chat.id;
                        self.group_name = res.edited_message.chat.title;
                        self.group_username = res.edited_message.chat.username;
                        self.type = res.edited_message.chat.type;
                        self.is_bot = res.edited_message.from.is_bot;
                        self.language_code = res.edited_message.from.language_code;
                        self.first_name = res.edited_message.from.first_name;
                        self.username = res.edited_message.from.username;
                        self.user_id = res.edited_message.from.id;
                    }
                }
                //console.log(res);
                if(Object.keys(res).includes("message")){
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
                        if(listenForAllMessage && res.message.chat.type != "supergroup"){
                            listenForAllMessage(res.message.text);
                        }
                        if(listenForGroupMessage && res.message.chat.type == "supergroup"){
                            listenForGroupMessage(res.message.text);
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

                    if(Object.keys(res.message).includes("new_chat_member")){
                        if(listenForNewMember){
                            listenForNewMember(res.message.new_chat_member);
                        }
                    }

                    if(Object.keys(res.message).includes("left_chat_member")){
                        if(listenForLeftMember){
                            listenForLeftMember(res.message.left_chat_member);
                        }
                    }
                }else if(Object.keys(res).includes("edited_message")){
                    if(listenForEditedMessage){
                        listenForEditedMessage(res.edited_message);
                    }
                }
                self.last = json.result[1].update_id;
            }
        }
        // Call poll() again to get the next message
        try{
            await poll();
        }catch(e){
            
        }
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
    this.onEvent = function(callback){
        listenForEvents = callback;
    }
    this.onGroupMessage = function(callback){
        listenForGroupMessage = callback;
    }
    this.onMessageEdited = function(callback){
        listenForEditedMessage = callback;
    }
    this.onNewMember = function(callback){
        listenForNewMember = callback;
    }
    this.onMemberLeft = function(callback){
        listenForLeftMember = callback;
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
                console.warn(res);
            }
        })
    }
    this.sendMessage = function(message) {
        let id = self.id;
        ajax({
            url: url + `/sendMessage?chat_id=${id}&text=${encodeURI(message)}&parse_mode=MarkdownV2`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
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
                console.warn(res);
            }
        })
    }
    this.deleteMessage = function() {
        let message_id = self.res.message.message_id;
        let id = self.id;
        try{
            ajax({
                url: url + `/deleteMessage?chat_id=${id}&message_id=${message_id}`,
                type: "POST",
                params: "",
                error: function(res) {
                    console.warn(res);
                }
            })
        }catch(e){

        }
    }
    this.sendPhoto = function(chat_id=null, photoUrl) {
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        ajax({
            url: url + `/sendPhoto?chat_id=${chat_id}&photo=${photoUrl}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }
    this.sendAudio = function(chat_id=null, audioUrl) {
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        ajax({
            url: url + `/sendAudio?chat_id=${chat_id}&audio=${audioUrl}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }
    this.sendDocument = function(chat_id=null, documentUrl) {
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        ajax({
            url: url + `/sendDocument?chat_id=${chat_id}&document=${documentUrl}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }
    this.sendVideo = function(chat_id=null, videoUrl) {
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        ajax({
            url: url + `/sendVideo?chat_id=${chat_id}&video=${videoUrl}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }
    this.forwardMessageTo = function(chat_id) {
        let from_id = self.id;
        let msg_id = self.res.message.message_id;
        ajax({
            url: url + `/forwardMessage?chat_id=${chat_id}&from_chat_id=${from_id}&message_id=${msg_id}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }
    this.copyMessageTo = function(chat_id) {
        let from_id = self.id;
        let msg_id = self.res.message.message_id;
        ajax({
            url: url + `/copyMessage?chat_id=${chat_id}&from_chat_id=${from_id}&message_id=${msg_id}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }
    this.sendChatAction = function(action,chat_id=null) {
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        ajax({
            url: url + `/sendChatAction?chat_id=${chat_id}&action=${action}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
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
                console.warn(res);
            }
        })
    }
    this.getFile = function(file_id){
        
        let response = ajaxSync({
            url: url + `/getFile?file_id=${file_id}`,
            type: "POST",
            params: "",
        });

        if(response){
            return "https://api.telegram.org/file/bot" + self.token + "/" + JSON.parse(response).result.file_path;
        }else{
            console.warn("getFile failed :(");
        }

    }
    this.unBanMember = function(group_username,user_id){
        if(!group_username.startsWith("@")){
            group_username = "@" + group_username; 
        }
        ajax({
            url: url + `/unbanChatMember?user_id=${user_id}&chat_id=${group_username}&only_if_banned=true`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }
    this.banMember = function(group_username=null,user_id=null){
        if(group_username == null){
            group_username = "@" + self.res.message.chat.username;
            user_id = self.res.message.from.id;
        }
        if(!group_username.startsWith("@")){
            group_username = "@" + group_username; 
        }
        ajax({
            url: url + `/banChatMember?user_id=${user_id}&chat_id=${group_username}&only_if_banned=true`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }
    this.setGroupPhoto = function(photoUrl,group_username){
        if(group_username == null){
            group_username = "@" + self.res.message.chat.username;
        }
        if(!group_username.startsWith("@")){
            group_username = "@" + group_username; 
        }
        ajax({
            url: url + `/setChatPhoto?chat_id=${group_username}&photo=${photoUrl}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }
    this.removeGroupPhoto = function(group_username=null){
        if(group_username == null){
            group_username = "@" + self.res.message.chat.username;
        }
        if(!group_username.startsWith("@")){
            group_username = "@" + group_username; 
        }
        ajax({
            url: url + `/deleteChatPhoto?chat_id=${group_username}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }

    this.setGroupName = function(group_new_name,group_username=null){
        if(group_username == null){
            group_username = "@" + self.res.message.chat.username;
        }
        if(!group_username.startsWith("@")){
            group_username = "@" + group_username; 
        }
        ajax({
            url: url + `/setChatTitle?chat_id=${group_username}&title=${group_new_name}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }

    this.setGroupInfo = function(group_new_info,group_username=null){
        if(group_username == null){
            group_username = "@" + self.res.message.chat.username;
        }
        if(!group_username.startsWith("@")){
            group_username = "@" + group_username; 
        }
        ajax({
            url: url + `/setChatDescription?chat_id=${group_username}&description=${group_new_info}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }

    this.pinMessage = function(message_id=null,chat_id=null){
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        if(message_id == null){
            message_id = self.res.message.message_id;
        }
        ajax({
            url: url + `/pinChatMessage?chat_id=${chat_id}&message_id=${message_id}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }

    this.unpinMessage = function(chat_id=null,message_id=null){
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        if(message_id == null){
            ajax({
                url: url + `/unpinChatMessage?chat_id=${chat_id}`,
                type: "POST",
                params: "",
                success: function(res) {
                    self.botLast = JSON.parse(res);
                },
                error: function(res) {
                    console.warn(res);
                }
            })
            return true;
        }
        ajax({
            url: url + `/unpinChatMessage?chat_id=${chat_id}&message_id=${message_id}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }

    this.unpinAllMessage = function(chat_id=null){
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        
        ajax({
            url: url + `/unpinAllChatMessages?chat_id=${chat_id}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }

    this.leaveGroup = function(group_username=null){
        if(group_username == null){
            group_username = "@" + self.res.message.chat.username;
        }
        if(!group_username.startsWith("@")){
            group_username = "@" + group_username; 
        }
        
        ajax({
            url: url + `/leaveChat?chat_id=${group_username}`,
            type: "POST",
            params: "",
            success: function(res) {
                self.botLast = JSON.parse(res);
            },
            error: function(res) {
                console.warn(res);
            }
        })
    }

    this.getChat = function(chat_id=null){
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        
        let response = ajaxSync({
            url: url + `/getChat?chat_id=${chat_id}`,
            type: "POST",
            params: "",
        });

        return JSON.parse(response).result;
    }

    this.getGroupAdmins = function(chat_id=null){
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        
        let response = ajaxSync({
            url: url + `/getChatAdministrators?chat_id=${chat_id}`,
            type: "POST",
            params: "",
        });

        return JSON.parse(response).result;
    }

    this.getGroupMemberLength = function(chat_id=null){
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        
        let response = ajaxSync({
            url: url + `/getChatMemberCount?chat_id=${chat_id}`,
            type: "POST",
            params: "",
        });

        return JSON.parse(response).result;
    }

    this.getGroupMember = function(user_id=null,chat_id=null){
        if(chat_id == null){
            chat_id = self.res.message.chat.id;
        }
        if(user_id == null){
            user_id = self.res.message.from.id;
        }
        
        let response = ajaxSync({
            url: url + `/getChatMember?chat_id=${chat_id}&user_id=${user_id}`,
            type: "POST",
            params: "",
        });

        return JSON.parse(response).result;
    }

    this.getUserPhotos = function(user_id=null){
        if(user_id == null){
            user_id = self.res.message.from.id;
        }
        
        let response = ajaxSync({
            url: url + `/getUserProfilePhotos?user_id=${user_id}`,
            type: "POST",
            params: "",
        });

        return JSON.parse(response).result;
    }
}

try{
    module.exports = Tele;
}catch(e){
    
}