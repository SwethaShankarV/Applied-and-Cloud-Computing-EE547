const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function loadStore(filePath, privateKey) {
  try {
    if (fs.existsSync(filePath)) {
      const encryptedData = fs.readFileSync(filePath);
      const decryptedData = crypto.privateDecrypt(privateKey, encryptedData);
      try {
        const store = JSON.parse(decryptedData.toString());
        console.log('Decrypted key-value store:', JSON.stringify(store, null, 2));
        return store;
      } catch (jsonError) {
        console.error('Invalid store file.');
        process.exit(2);
      }      
    } else {
      return {};
    }
  } catch (error) {
    console.error('Decryption failed or invalid store file.');
    process.exit(3);
  }
}

function isPublicKey(key) {
    return key.includes("-----BEGIN PUBLIC KEY-----");
}

function encryptStore(store, publicKey, filePath) {
    try {
      fs.accessSync(filePath, fs.constants.W_OK); 
    } catch (error) {
      console.error('File write error: Cannot write to the store file.');
      return; 
    }

    if (!isPublicKey(publicKey)) {
        console.error('Error: The provided key is not a public key. Please provide a valid public key for encryption.');
        return;
    }
  
    try {
      const storeData = JSON.stringify(store);
      const encryptedData = crypto.publicEncrypt(publicKey, Buffer.from(storeData));
      fs.writeFileSync(filePath, encryptedData); 
      console.log('Store encrypted and saved.');
      process.exit(0); 
    } catch (error) {
      console.error('Error during encryption process: ', error.message);
    }
}

function isValidKey(key) {
  return /^[\w\-_]+(?:[\s][\w\-_0-9]+)*$/.test(key) && !key.startsWith(' ') && !key.endsWith(' '); // Alphanumeric, spaces, underscores, hyphens
}

function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function createEmptyStoreFile(filePath) {
    try {
      const emptyStore = {};
      fs.writeFileSync(filePath, JSON.stringify(emptyStore)); 
      console.log('Created a new empty store file.');
    } catch (error) {
      console.error('Error creating the store file.');
      process.exit(1);
    }
  }

async function main() {
  const args = process.argv.slice(2);
  const storeFile = args[0];
  if (args.includes('--help') || args=='') {
    showHelp();
  }

  let privateKey, publicKey;

  if (fs.existsSync(storeFile)) {
    const privateKeyPath = await prompt('Enter the private key file path: ');
      try {
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        store = loadStore(storeFile, privateKey);
        console.log("\nDecryption successful, proceeding to manu");
      } catch (err) {
        console.error('Decryption failed or invalid store file.');
        process.exit(3);
      }
    }
    else {
    createEmptyStoreFile(storeFile);
    store = {};
    }

  while (true) {
    console.log(`
    1) Add key-value
    2) Delete key
    3) Show current key-value store
    4) Encrypt key-value store
    `);

    const choice = await prompt('Choose an option: ');

    if (choice === '1') {
      const key = await prompt('Press Enter to return to menu or Enter the key (alphanumeric, spaces, underscores, hyphens): ');
      if (key === '') {
        console.log('Returning to menu...');
        continue;
      }
      if (!isValidKey(key)) {
        console.log('Invalid key. Please enter a valid key.');
        continue;
      }
      const value = await prompt('Enter value: ');
      
    if (store[key]) {
        console.log(`Warning: Key '${key}' already exists. Value was overwritten.`);
    }
      store[key] = value;
      console.log(`Key-value pair added. Key: ${key}, Value: ${value}`);
    } 
    else if (choice === '2') {
      const keyToDelete = await prompt('Press enter for Menu or Enter the key to delete: ');
      if (keyToDelete === '') {
        console.log('Returning to menu...');
        continue;
      }
      if (store[keyToDelete]) {
        delete store[keyToDelete];
        console.log(`Key "${keyToDelete}" deleted.`);
      } else {
        console.log('Key not found.');
      }
    }
    else if (choice === '3') {
      console.log('Current key-value store:', JSON.stringify(store, null, 2));
    }
    else if (choice === '4') {
        const publicKeyPath = await prompt('Enter the public key file path: ');
      
        try {
          publicKey = fs.readFileSync(publicKeyPath, 'utf8');
          if (!isPublicKey(publicKey)) {
            console.error('Invalid public key file or the key provided is not a public key.');
            continue;
          }
          encryptStore(store, publicKey, storeFile);
        } catch (err) {
          console.error('Invalid public key file or unable to read the file.');
          continue;
        }
    }
  }
}

function showHelp() {
    console.log(`
        Usage: node app.js [store.encjson] [--help]

        Description:
        This application manages a secret key-value store with encryption and
        decryption using RSA public/private keys. On startup, if the store file
        exists, the application prompts for a private key to decrypt the file.
        After interacting with the key-value store, you can encrypt it with a
        public key before saving.

        Options:
        store.encjson Path to the key-value store file (required).
        --help Display this help message and exit.

        Examples:

        node app.js store.encjson # Start with a store file.

        node app.js --help # Display this help message.`
    );
    rl.close();
    process.exit(0);
}

main();