export const serverURL = "http://localhost:8081/api/VRmgDB/data";
export const imageProxyURL = "http://localhost:8081/api/proxy/media";
export const audioProxyURL = "http://localhost:8081/api/proxy/media";

export const SongCard3DRadius = 4.0;        //歌曲選單，大圓半徑
export const menuMgCardsSize= 1.3;          //歌曲選單每首歌曲的大小

//遊戲範圍配置
export const seatRadius = 1.1;                         //座位半徑                       //改這裡動全部
export const gameAreaRingRadiusIn = 4.9;                //遊戲範圍_環_內圈半徑
export const gameAreaRingRadiusOut = 4.93;              //遊戲範圍_環_外圈半徑
export const seatRingRadiusIn =  seatRadius;            //座位_環_內圈半徑
export const seatRingRadiusOut = seatRadius + 0.01;     //座位_環_外圈半徑

//玩家位置配置
export const playerMarkIn = seatRadius + 0.05;              //玩家位置_環_內圈半徑
export const playerMarkOut = seatRadius + 0.1;          //玩家位置_環_外圈半徑

// 音符配置
export const startPosition = gameAreaRingRadiusIn;           //起始位置 + 遊戲範圍
export const endPosition = seatRadius + 0.15 ;            //結束判定位置

export const perfectRange = 15;           //perfect 判定角度範圍
export const goodRange = 30;              //good 判定角度範圍