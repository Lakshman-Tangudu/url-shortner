import { QRCodeCanvas } from 'qrcode.react';

function QRGenerator({ url }) {
  return <QRCodeCanvas value={url} size={100} />;
}

export default QRGenerator;