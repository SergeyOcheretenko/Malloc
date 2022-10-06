// CONSTANTS 
const HEADER_SIZE = 4;
const BUFFER_LENGTH = 30;
let buffer = new Buffer.alloc(BUFFER_LENGTH);
const pointers = [];

// METHODS

function savePointer(headerPointer) {
  pointers.push(headerPointer);
  pointers.sort(function(a, b) {
    return a - b;
  });
}

function writeHeader(startIndex, blockSize, isAvailable) {
  buffer[startIndex] = isAvailable ? 0 : 1;
  for (let i = startIndex + 1; i < HEADER_SIZE - 1; i++) {
    buffer[i] = 0;
  }
  buffer[startIndex + HEADER_SIZE - 1] = blockSize;
  savePointer(startIndex);
}

function cleanHeader(headerPointer) {
  for (let i = headerPointer; i < headerPointer + HEADER_SIZE; i++) {
    buffer[i] = 0;
  }
  if (pointers.length == 1 && pointers[0] == 0) {
    pointers.shift();
    return;
  }
  pointers.splice(pointers.findIndex(p => p == headerPointer), 1);
}

function mergeHeaders() {
  for (let i = 1; i < pointers.length; i++) {
    const headerPointer = pointers[i];
    const previousHeaderPointer = pointers[i - 1];

    if (buffer[headerPointer] == 0 && buffer[previousHeaderPointer] == 0) {
      const blockSizePointer = headerPointer + HEADER_SIZE - 1;
      const previousBlockSizePointer = previousHeaderPointer + HEADER_SIZE - 1;

      buffer[previousBlockSizePointer] += HEADER_SIZE + buffer[blockSizePointer];
      cleanHeader(headerPointer, HEADER_SIZE);
      // pointers.splice(i, 1);
      i--;
    }
  }
  // if (pointers.length == 1 && pointers[0] == 0) {
  //   pointers.shift();
  // }
}

function findRightFreeBlock(neededSize) {
  for (const pointer of pointers) {
    if (buffer[pointer] == 1) {
      continue;
    }

    const blockSizePointer = pointer + HEADER_SIZE - 1;

    if (buffer[blockSizePointer] >= neededSize) {
      return pointer;
    }
  }
  // for (let i = 0; i < buffer.length; i++) {
  //   const headerPointer = i;
  //   const blockSizePointer = i + HEADER_SIZE - 1;
  //   if (buffer[headerPointer] == 1) {
  //     i += HEADER_SIZE + buffer[blockSizePointer] - 1;
  //     continue;
  //   }
  //   if (buffer[blockSizePointer] >= neededSize) {
  //     return headerPointer;
  //   }
  // }
}

function tryToCreateHeaderAfterBlock(previousBlockHeader, pointer) {
  const index = pointers.findIndex(elem => elem == previousBlockHeader);
  const previousBlockSizePointer = previousBlockHeader + HEADER_SIZE - 1;
  
  if (index == pointers.length - 1) {
    if (pointer + HEADER_SIZE >= buffer.length) {
      buffer[previousBlockSizePointer] += (buffer.length - pointer);
      return;
    }
    writeHeader(pointer, buffer.length - pointer - HEADER_SIZE, true);
    return;
  }
  
  const nextBlockPointer = pointers[pointer + 1];
  if (nextBlockPointer - pointer < HEADER_SIZE) {
    buffer[previousBlockSizePointer] += (nextBlockPointer - pointer);
    return;
  }

  const remainingSpace = nextBlockPointer - pointer - HEADER_SIZE;
  writeHeader(pointer, remainingSpace, true);
}

function allocateBlock(headerPointer, neededSize) {
  cleanHeader(headerPointer, HEADER_SIZE);
  writeHeader(headerPointer, neededSize, false);
  // savePointer(headerPointer);
  const nextBlockPointer = headerPointer + HEADER_SIZE + neededSize;
  tryToCreateHeaderAfterBlock(headerPointer, nextBlockPointer);
}

function allocate(size) {
  const pointer = findRightFreeBlock(size);
  if (pointer == undefined) {
    console.log('Unable to allocate')
    return;
  }
  allocateBlock(pointer, size);
}

function free(pointer) {
  buffer[pointer] = 0;
  const firstPointerAfterHeader = pointer + HEADER_SIZE;
  const blockSizePointer =  firstPointerAfterHeader - 1;
  const nextBlockPointer = firstPointerAfterHeader + buffer[blockSizePointer];
  for (let i = firstPointerAfterHeader; i < nextBlockPointer; i++) {
    buffer[i] = 0;
  }
  mergeHeaders();
}

// PREPARE
writeHeader(0, buffer.length - HEADER_SIZE, true);
console.log(buffer);
console.log(pointers);
console.log('\n');

// TESTS
console.log('allocate(5)');
allocate(5);
buffer[5] = 67;
buffer[6] = 57;
console.log(buffer);
console.log(pointers);
console.log('\n');

console.log('allocate(6)');
allocate(6);
buffer[14] = 23;
buffer[13] = 16;
console.log(buffer);
console.log(pointers);
console.log('\n');

console.log('allocate(3)');
allocate(3);
console.log(buffer);
console.log(pointers);
console.log('\n');

console.log('free(9)');
free(9);
console.log(buffer);
console.log(pointers);
console.log('\n');

console.log('free(0)');
free(0);
console.log(buffer);
console.log(pointers);
console.log('\n');

console.log('free(19)');
free(19);
console.log(buffer);
console.log(pointers);
console.log('\n');

console.log('allocate(20)');
allocate(20);
console.log(buffer);
console.log(pointers);
console.log('\n');

console.log('allocate(3)');
allocate(3);
console.log(buffer);
console.log(pointers);
console.log('\n');

console.log('allocate(2)');
allocate(2);
console.log(buffer);
console.log(pointers);
console.log('\n');

console.log('free(24)');
free(24);
console.log(buffer);
console.log(pointers);
console.log('\n');

console.log('free(0)');
free(0);
console.log(buffer);
console.log(pointers);
