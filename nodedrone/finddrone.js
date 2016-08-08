'use strict';
//Droneを探す

//Bluetoothのライブラリーを取り込む
var noble = require('noble');
var num = 0;

//電源がonのとき
if (noble.state === 'poweredOn') {
  //スキャン
  start()
} else {
  //onにしてスキャン
  noble.on('stateChange', start);
}
//スキャン開始
function start () {
  //スキャン開始
  noble.startScanning();
  //見つかった時の処理
  noble.on('discover', function(peripheral) {
    num++;
    console.log(num,"uuid:"+peripheral.uuid,peripheral.advertisement.localName);
  });
}
