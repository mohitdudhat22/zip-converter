const fs = require('fs');
const zlib = require('zlib');

function createLocalFileHeader(filename, compressedSize, uncompressedSize){
    const fileNameLength = Buffer.byteLength(filename);
    const header = Buffer.alloc(30 + fileNameLength);

    header.writeUInt32LE(0x04034b50, 0); // Signature
    header.writeUInt16LE(20, 4); // Version
    header.writeUInt16LE(0, 6); // General purpose bit flag
    header.writeUInt16LE(0, 8); // Compression method
    header.writeUInt16LE(0, 10); // Last mod file time
    header.writeUInt16LE(0, 12); // Last mod file date
    header.writeUInt32LE(0, 14); // CRC-32 (placeholder)
    header.writeUInt32LE(compressedSize, 18);
    header.writeUInt32LE(uncompressedSize, 22);
    header.writeUInt16LE(fileNameLength, 26); // File name length
    header.writeUInt16LE(0, 28); // Extra field length
    header.write(filename, 30); // File name

    return header;
}

function createCentralDirectoryHeader(filename, offset, compressedSize, uncompressedSize){
    const fileNameLength = Buffer.byteLength(filename);
    const header = Buffer.alloc(46 + fileNameLength);
    
    header.writeUInt32LE(0x02014b50, 0); // Central Directory File Header Signature
    header.writeUInt16LE(20, 4); // Version made by
    header.writeUInt16LE(20, 6); // Version needed to extract
    header.writeUInt16LE(0, 8); // General purpose bit flag
    header.writeUInt16LE(0, 10); // Compression method
    header.writeUInt16LE(0, 12); // Last mod file time
    header.writeUInt16LE(0, 14); // Last mod file date
    header.writeUInt32LE(0, 16); // CRC-32 (placeholder)
    header.writeUInt32LE(compressedSize, 20); // Compressed size
    header.writeUInt32LE(uncompressedSize, 24); // Uncompressed size
    header.writeUInt16LE(fileNameLength, 28); // File name length
    header.writeUInt16LE(0, 30); // Extra field length
    header.writeUInt16LE(0, 32); // File comment length
    header.writeUInt16LE(0, 34); // Disk number start
    header.writeUInt16LE(0, 36); // Internal file attributes
    header.writeUInt32LE(0, 38); // External file attributes
    header.writeUInt32LE(offset, 42); // Relative offset of local header
    header.write(filename, 46); // File name
    
    return header;
}

function createEndOfCentralDirectoryRecord(centralDirectorySize, centralDirectoryOffset){
    const record = Buffer.alloc(22);
    record.writeUInt32LE(0x06054b50, 0); // End of Central Directory Signature
    record.writeUInt16LE(0, 4); // Number of this disk
    record.writeUInt16LE(0, 6); // Disk where central directory starts
    record.writeUInt16LE(1, 8); // Number of central directory records on this disk
    record.writeUInt16LE(1, 10); // Total number of central directory records
    record.writeUInt32LE(centralDirectorySize, 12); // Size of central directory
    record.writeUInt32LE(centralDirectoryOffset, 16); // Offset of start of central directory
    record.writeUInt16LE(0, 20); // ZIP file comment length
    return record;
}

function createZip(filePath, zipPath) {

    //data which i extracted from the file
    const filename = filePath.split('/').pop();
    const fileData = fs.readFileSync(filePath);
    const compressedData = zlib.deflateSync(fileData);
    const compressedSize = compressedData.length;
    const uncompressedSize = fileData.length;

    //zip file headers
    const localFileHeader = createLocalFileHeader(filename, compressedSize, uncompressedSize);
    const centralDirectoryHeader = createCentralDirectoryHeader(filename, localFileHeader.length + compressedSize, compressedSize, uncompressedSize);
    const endOfCentralDirectoryRecord = createEndOfCentralDirectoryRecord(centralDirectoryHeader.length, localFileHeader.length + compressedSize);
    
    fs.writeFileSync(zipPath, Buffer.concat([
        localFileHeader,
        compressedData,
        centralDirectoryHeader,
        endOfCentralDirectoryRecord
    ]));

}
const filePath = './a.txt';
const zipPath = './a.zip';
createZip(filePath, zipPath);