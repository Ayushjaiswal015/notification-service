// socket.js
let ioInstance = null;

module.exports = {
  setIo: (io) => { ioInstance = io; },
  getIo: () => ioInstance,
};
