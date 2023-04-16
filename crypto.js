const fs = require("fs");
const keys = require("./keys.json");

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"

function generateRandomChar(){

    const char = alphabet[Math.floor(Math.random() * alphabet.length)]
    return char
}

const crypto = {

    generateKey: async () => {
    
        let keyId = ""
        let replaces = {}
        let space = []
        let used = []

        function isAble(_rep) {

            used.forEach(i => {

                if(i.includes(_rep) || _rep.includes(i)){
                    return false
                }
            })
            return true
        }

        alphabet.split("").forEach(i => {

            let replaceAmount = Math.floor(Math.random() * 3) + 2
            let _replaces = []
            
            for(let i = 0; i <= replaceAmount; i++){
                
                let replaceChar = ""
                let charAmount = Math.floor(Math.random() * 2) + 2

                for(let j = 0; j <= charAmount; j++){

                    function generateChar(){
                        let char = generateRandomChar()

                        if(!isAble(replaceChar + char)){
                            generateChar()
                        }
                        else{
                            replaceChar += char
                        }
                    }
                    generateChar()
                }
                used.push(replaceChar)
                _replaces.push(replaceChar)
            }
    
            replaces[i] = _replaces
        })

        let spaceAmount = Math.floor(Math.random() * 3) + 2

        for(let i = 0; i <= spaceAmount; i++){

            let replaceChar = ""
            let charAmount = Math.floor(Math.random() * 2) + 2

            for(let j = 0; j <= charAmount; j++){

                function generateChar(){
                    let char = generateRandomChar()

                    if(!isAble(replaceChar + char)){
                        generateChar()
                    }else{
                        replaceChar += char
                    }
                }
                generateChar()
            }
            used.push(replaceChar)
            space.push(replaceChar)
        }

        for(let i = 0; i <= 4; i++){

            let char = generateRandomChar()
            keyId += char
        }

        const key = {
            id: keyId,
            replaces: replaces,
            space: space
        }
    
        keys.push(key) 
        fs.writeFileSync("keys.json",JSON.stringify(keys))
    },
    
    // generateKey();
    
    encryptText: async (text) => {
    
        const _key = Math.floor(Math.random() * keys.length);
        const key = keys[_key];
        
        let encryptedText = key.id
        let space = key.space
    
        text.split("").forEach(i => {
    
            let replaces = key.replaces[i]
    
            if(replaces){
    
                let replaceId = Math.floor(Math.random() * replaces.length);
    
                encryptedText += replaces[replaceId]
            }else if(i == " "){
                
                let spaceId = Math.floor(Math.random() * space.length);
    
                encryptedText += space[spaceId]
            }
            else{
                encryptedText += i
            }
        })

        return encryptedText
    },
    
    decryptText: async (text) => {
        
        let keyId = text.slice(0, 5)
        let decryptText = text.slice(5)
    
        let key = keys.find(i => i.id == keyId);
    
        for(let [k,v] of Object.entries(key.replaces)){
    
            v.forEach(i => {
                
                if(decryptText.includes(i)){
                    decryptText = decryptText.split(i).join(k)
                }
            })
        }
    
        key.space.forEach(i => {
            if(decryptText.includes(i)){
                decryptText = decryptText.split(i).join(" ")
            }
        })
    
        return decryptText
    },

    getKeysAmount: () => {
        return keys.length
    },

    clearKeys: () => {

        let _keys = []
        fs.writeFileSync("keys.json",JSON.stringify(_keys))
    }

}

module.exports = crypto