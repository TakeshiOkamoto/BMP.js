# BMP.js
Output images in JavaScript as BMP format.  

## Support format  
1/4/8/24bit

## How to use 

English

```rb
// *** Constructor   
// First argument : ImageData object  
var BMPWriter = new TBMPWriter(imagedata);

// *** Method  
// First  argument : file name
BMPWriter.SaveToFile('untitle.bmp');

```

Japanese  
```rb
// *** コンストラクタ   
// 第一引数 : ImageData オブジェクト  
var BMPWriter = new TBMPWriter(imagedata);

// *** メソッド  
// 第一引数 : ファイル名
BMPWriter.SaveToFile('untitle.bmp');

``` 

## Caution
If the HTML file is not uploaded to the server, it may not work depending on browser specifications.

HTML5 Web Worker makes it multi-threaded and faster.  

HTMLファイルがサーバーにアップロードされていない場合、ブラウザの仕様によっては動作しないことがあります。

HTML5の新機能であるWeb Workerを使用するとマルチスレッドで高速に並列処理が可能です。

## Contact
sorry, no warranty, no support. English Can understand only 3-year-old level.  

## Author
Copyright (c) 2016 Takeshi Okamoto

## Licence
MIT license.  
