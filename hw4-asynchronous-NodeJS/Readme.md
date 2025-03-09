# RSA Encrypted Key-Value Store Application

This Node.js application manages a secret key-value store with encryption and decryption using RSA public/private keys. It allows users to:

- **Add** key-value pairs
- **Delete** keys
- **View** the current key-value store
- **Encrypt** the store using a public key

The store is encrypted with RSA and saved to a file, which can only be decrypted using the corresponding private key.

## Features

- **Key-Value Store**: The application stores data as key-value pairs.
- **Encryption**: The key-value store can be encrypted using a public RSA key.
- **Decryption**: If the store is encrypted, the user is prompted to provide a private key for decryption.
- **RSA Public/Private Key Pair**: The application uses a public key for encryption and a private key for decryption.

## Setup

1. Clone the repository or download the code.
2. Install the required dependencies:
    ```bash
    npm install
    ```
3. Ensure that RSA public and private keys are available for encryption and decryption. These can be generated using OpenSSL:
    ```bash
    openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
    openssl rsa -pubout -in private.pem -out public.pem
    ```

## Usage

### Starting the Application

To run the application, use the following command:

```bash
node app.js store.encjson
```

Where:
- `store.encjson` is the path to the encrypted key-value store file. If the file does not exist, the application initializes a new, empty store.

For the help message, use:

```bash
node app.js --help
```

### Commands

Upon startup, the application will display the following menu:

```
1) Add key-value
2) Delete key
3) Show current key-value store
4) Encrypt key-value store
```

- **Option 1**: Adds a new key-value pair. The user is prompted for the key (alphanumeric, spaces, underscores, hyphens) and the value.
- **Option 2**: Deletes a key. The user is prompted for the key to delete.
- **Option 3**: Displays the current key-value store.
- **Option 4**: Encrypts the store using a public RSA key.

### Private Key for Decryption

If a store file exists and is encrypted, the application prompts for the private key to decrypt the file:

```
Enter the path to your private key file: [private key path]
```

### Public Key for Encryption

For encrypting the store, the user is prompted to provide the **public key**:

```
Enter the public key file path: [public key path]
```

### Error Handling

- If the key is incorrect or the store is invalid, appropriate error messages are displayed.
- If the user attempts to encrypt the store without a valid public key, an error message is shown.

## Example

1. **Start with an encrypted store**:
    ```bash
    node app.js store.encjson
    ```
    - If the store exists, the application will prompt for the private key for decryption.

2. **Add a key-value pair**:
    - Select option `1`, then enter a key and a value.

3. **Encrypt the store**:
    - After interacting with the store, the user can choose option `4` to encrypt the store using the public key.

## Notes

- **Security**: The encryption and decryption are performed using RSA keys. It is essential to keep the private and public keys secure.
- **File Permissions**: The application assumes appropriate file permissions for reading and writing to the store file and key files.
