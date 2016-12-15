/**************************************************/
/*                                                */
/*     BMP.js                                     */
/*                                      v0.88     */
/*                                                */
/*     Copyright 2016 Takeshi Okamoto (Japan)     */
/*                                                */
/*     Released under the MIT license             */
/*     https://github.com/TakeshiOkamoto/         */
/*                                                */
/*                            Date: 2016-12-16    */
/**************************************************/

////////////////////////////////////////////////////////////////////////////////
// Generic Class
////////////////////////////////////////////////////////////////////////////////

// ---------------------
//  TFileStream            
// ---------------------
function TFileStream(BufferSize) {

    if (BufferSize == undefined)
        this.MemorySize = 5000000; // 5M
    else
        this.MemorySize = parseInt(BufferSize, 10);

    this.Size = 0;
    this.Stream = new Uint8Array(this.MemorySize);
}

// ---------------------
//  TFileStream.Method     
// ---------------------
TFileStream.prototype = {

    _AsciiToUint8Array: function (S) {
        var len = S.length;
        var P = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            P[i] = S[i].charCodeAt(0);
        }
        return P;
    },

    WriteByte: function (value) {
        var P = new Uint8Array(1);
        
        P[0] = value;
        
        this.WriteStream(P);      
    },
    
    WriteWord: function (value) {
        var P = new Uint8Array(2);
        
        P[1] = (value & 0xFF00) >> 8;
        P[0] = (value & 0x00FF);  
        
        this.WriteStream(P);      
    },

    WriteDWord: function (value) {
        var P = new Uint8Array(4);
        
        P[3] = (value & 0xFF000000) >> 24;
        P[2] = (value & 0x00FF0000) >> 16;
        P[1] = (value & 0x0000FF00) >> 8;
        P[0] = (value & 0x000000FF);  
        
        this.WriteStream(P);      
    },
    
    WriteWord_Big: function (value) {
        var P = new Uint8Array(2);
        
        P[1] = (value & 0x00FF);
        P[0] = (value & 0xFF00) >> 8;  
        
        this.WriteStream(P);      
    },        
    
    WriteDWord_Big: function (value) {
        var P = new Uint8Array(4);
        
        P[3] = (value & 0x000000FF) 
        P[2] = (value & 0x0000FF00) >> 8;
        P[1] = (value & 0x00FF0000) >> 16;
        P[0] = (value & 0xFF000000) >> 24;;  
        
        this.WriteStream(P);      
    },
        
    WriteString: function (S) {
        var P = this._AsciiToUint8Array(S);

        // メモリの再編成
        if (this.Stream.length <= (this.Size + P.length)) {
            var B = new Uint8Array(this.Stream);
            this.Stream = new Uint8Array(this.Size + P.length + this.MemorySize);
            this.Stream.set(B.subarray(0, B.length));
        }

        this.Stream.set(P, this.Size);
        this.Size = this.Size + P.length;
    },

    WriteStream: function (AStream) {      
        
        // メモリの再編成
        if (this.Stream.length <= (this.Size + AStream.length)) {
            var B = new Uint8Array(this.Stream);
            this.Stream = new Uint8Array(this.Size + AStream.length + this.MemorySize);
            this.Stream.set(B.subarray(0, B.length));
        }

        this.Stream.set(AStream, this.Size);
        this.Size = this.Size + AStream.length;
    },

    getFileSize: function () {
        return this.Size;
    },

    SaveToFile: function (FileName,type) {
        if (window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(new Blob([this.Stream.subarray(0, this.Size)], { type: type }), FileName);
        } else {
            var a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([this.Stream.subarray(0, this.Size)], { type: type }));
            //a.target   = '_blank';
            a.download = FileName;
            document.body.appendChild(a); //  FF specification
            a.click();
            document.body.removeChild(a); //  FF specification
        }
    },
}

// ---------------------
//  TBMPWriter        
// ---------------------
function TBMPWriter(imagedata) {
  this.raw    = imagedata.data;
  this.width  = imagedata.width;
  this.height = imagedata.height;  

  // カラーパレットの生成
  this._getColorPalette();
}
  
TBMPWriter.prototype = {
        
    // 4の倍数に対応した横幅のバイト数を取得する
    GetBitmapWidth: function(BitCount,Width){
      var result = 0;

      switch (BitCount){
          case 1  : result = Math.floor((Width + 7) / 8); break;
          case 4  : result = Math.floor((Width + 7) / 8) << 2; break;
          case 8  : result = Width; break;
          case 16 : result = Math.floor((Width * 16 + 31) / 32) * 4; break; 
          case 24 : result = Math.floor((Width * 24 + 31) / 32) * 4; break;
          case 32 : result = Math.floor((Width * 32 + 31) / 32) * 4; break;         
      }
      
      if (BitCount == 1 || BitCount == 4 || BitCount == 8){
          if ((result & 3) != 0)  result = (result | 3) + 1;
      }

      return result;
    },

    // 画像からパレットの生成
    _getColorPalette: function () {
        var height = this.height;
        var width  = this.width;
        var raw    = this.raw;
        
        // 使用している色数の取得
        var cnt = 0;
        var uses_colors = new Object;
        
        for(var i = 0; i< height;i++){
            for(var j = 0; j< width;j++){
                var key = raw[cnt]   + ',' + 
                          raw[cnt+1] + ',' + 
                          raw[cnt+2] ;
                    uses_colors[key] = 1;        
                cnt = cnt + 4;
            }
        }
        
        var cnt = 0;
        for (var key in uses_colors) { cnt++; }
        
        // 24bit
        if (cnt > 256){
          
          this.palette = null;
          this.uses_colors = null;
          this.color_depth = 24;
        
        // 2/16/256色(1/4/8bit)   
        }else{        
          
          // 配列の設定
          var rgb,cnt = 0;
          var palette = new Array();   
          for (var key in uses_colors) {
              rgb = key.split(",");
              
              // 連想配列を配列へ変換
              palette[cnt] = {'r':parseInt(rgb[0],10),
                              'g':parseInt(rgb[1],10),
                              'b':parseInt(rgb[2],10)};
                                       
              // 連想配列へカラー番号を設定(高速化用)                         
              uses_colors[key] = cnt;
                  
              cnt++;                     
          }
          
          // ビット深度の設定         
          var len = palette.length;
          if(len >= 0 && len <=2){
            this.color_depth = 1;
          }else if(len >= 3 && len <=16){
            this.color_depth = 4;
          }else if(len >= 17 && len <=256){
            this.color_depth = 8;            
          }
          
          this.palette = palette;
          this.uses_colors = uses_colors;
        }                
    },

    // イメージデータの書き込み
    _WriteImageData: function (Stream,XorSize) {
        var onebyte  = 0;  // 1byte用
        var p_cnt    = 0;  // ストリームのカウンタ
        var img_cnt  = 0;  // イメージのカウンタ
        var line_cnt = 0;  // 一行のカウンタ
        
        var width  = this.width;
        var height = this.height;
        var raw    = this.raw;
        var color_depth = this.color_depth;  
        var uses_colors = this.uses_colors;      
        
        // 一行の実際の横幅(パディング含む)
        var LineWidth = this.GetBitmapWidth(color_depth,width);
                
        P = new Uint8Array(XorSize);
        
         // ゼロクリア
        for (var j = 0; j < P.length; j++) { P[j] = 0; }    

        // *** 1bit
        if(color_depth == 1){            
            
            for (var i = 0; i < height; i++) {               
                line_cnt = 0; 
                for (var j = 0; j < LineWidth; j++) {
                  
                  // 実際の幅を超えたらパディング
                  if (line_cnt >= width){
                    
                       P[p_cnt++] = 0;  
                
                  // 1つのピクセルデータを1bitで設定する   
                  }else{                
                    if (line_cnt < width){                      
                       onebyte  = uses_colors[raw[img_cnt]   + ',' +
                                              raw[img_cnt+1] + ',' + 
                                              raw[img_cnt+2] ] << 7;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                      
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 6;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                      
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 5;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                    
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 4;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                    
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 3;
                       img_cnt += 4;                            
                       line_cnt++;
                    }

                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 2;
                       img_cnt += 4;                            
                       line_cnt++;
                    } 
                    
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 1;
                       img_cnt += 4;                            
                       line_cnt++;
                    }  
                    
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ];
                       img_cnt += 4;                            
                       line_cnt++;
                    }     
                                                                                                           
                    P[p_cnt++] = onebyte;
                      
                  }
                  onebyte = 0;
                }
            }   

        // *** 4bit       
        }else if(color_depth == 4){
            var onebyte = 0;
            
            for (var i = 0; i < height; i++) {               
                line_cnt = 0; 
                for (var j = 0; j < LineWidth; j++) {
                  
                  // 実際の幅を超えたらパディング
                  if (line_cnt >= width){
                       P[p_cnt++] = 0;  
                                        
                  // 1つのピクセルデータを4bitで設定する   
                  }else{                
                    if (line_cnt < width){
                        onebyte  = uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 4;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                    
                    if (line_cnt < width){
                        onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                                raw[img_cnt+1] + ',' + 
                                                raw[img_cnt+2] ];
                       img_cnt += 4;                            
                       line_cnt++;
                    }     
                                                                                                           
                    P[p_cnt++] = onebyte;
                      
                  }
                  onebyte = 0;
                }
            }               
        
        // *** 8bit       
        }else if(color_depth == 8){  
          
            for (var i = 0; i < height; i++) { 
                line_cnt =0;   
                for (var j = 0; j < width; j++) {
                   P[p_cnt++] = uses_colors[raw[img_cnt]   + ',' +
                                            raw[img_cnt+1] + ',' + 
                                            raw[img_cnt+2] ];
                   img_cnt += 4;                                                   
                   line_cnt++;
                }
                // パディング
                while (true){
                  if (line_cnt == LineWidth) break;
                  p_cnt++;
                  line_cnt++;
                } 
             } 

        // *** 24bit       
        }else if(color_depth == 24){
          
            for (var i = 0; i < height; i++) { 
                line_cnt =0;   
                for (var j = 0; j < width; j++) {
                   P[p_cnt++] = raw[img_cnt+2];
                   P[p_cnt++] = raw[img_cnt+1];
                   P[p_cnt++] = raw[img_cnt];
                   
                   img_cnt += 4;  
                   line_cnt += 3;
                }
                // パディング
                while (true){
                  if (line_cnt == LineWidth) break;
                  p_cnt++;
                  line_cnt++;
                } 
             } 
        }      
        
        // イメージを反転
        var cnt = 0;
        var B = new Uint8Array(P.length);
        for (var i = height -1; i >=0 ; i--) {
            for (var j = 0; j < LineWidth; j++) {
                B[cnt++] = P[(LineWidth*i)+ j]; 
            }
        }
              
        Stream.WriteStream(B);      
    },
            
    SaveToStream: function () {
        var F = new TFileStream();
        
        // ピクセルデータの計算
        var XorSize = Math.floor((this.color_depth * this.width + 31) / 32) * 4 * Math.abs(this.height);
        
        // パレットデータの計算(1つの色はBGRAの4バイト)
        var PaletteSize = 0;
        if (this.color_depth != 24){
          PaletteSize = Math.pow(2,this.color_depth) *4;
        }
               
        // -------------------------
        //  BitmapFileHeader(14byte)
        // -------------------------
        
        // 0x424D(BM)
        F.WriteByte(0x42);
        F.WriteByte(0x4D);
        
        // ファイルサイズ
        F.WriteDWord(14 + 40 + PaletteSize + XorSize);
        // 予約1
        F.WriteWord(0);
        // 予約2
        F.WriteWord(0);
        // 画像データ(XOR)までのバイト数
        F.WriteDWord(14 + 40 + PaletteSize);

        // -------------------------
        //  BitmapInfoHeader(40byte)
        // -------------------------
            
        // 構造体のサイズ
        F.WriteDWord(40);        
        // 幅
        F.WriteDWord(this.width);        
        // 高さ
        F.WriteDWord(this.height);        
        // 常に1
        F.WriteWord(1);        
        // カラービット数(0,1,4,8,16,24,32)
        F.WriteWord(this.color_depth);        
        // 圧縮形式 非圧縮:0 
        F.WriteDWord(0);        
        // イメージのサイズ(Xor) 
        F.WriteDWord(XorSize);        
        // 水平解像度
        F.WriteDWord(0);        
        // 垂直解像度
        F.WriteDWord(0);        
        // 実際に使用されているカラーテーブルのエントリ数
        F.WriteDWord(0);
        // 重要なカラーテーブル数
        F.WriteDWord(0);
         
        // ----------------------
        //  カラーパレット
        // ----------------------            
        if (this.color_depth != 24){
          for (var i = 0; i < this.palette.length; i++) {
             F.WriteByte(this.palette[i].b);
             F.WriteByte(this.palette[i].g);
             F.WriteByte(this.palette[i].r);
             F.WriteByte(0);            
          }  
          
          // 不足分のパレット
          for (var i = this.palette.length ; i < Math.pow(2,this.color_depth); i++) {
             F.WriteByte(0);
             F.WriteByte(0);
             F.WriteByte(0);
             F.WriteByte(0);            
          }              
        }       

        // ----------------------
        //  Xor
        // ----------------------
        this._WriteImageData(F,XorSize);           
        
        return F;              
    },    
    
    // BMPファイルの生成     
    // FileName : ファイル名
    SaveToFile: function (FileName) {
      var F = this.SaveToStream();
    
      // ファイルをダウンロード             
      F.SaveToFile(FileName,"image/bmp");   
    }       
}  
