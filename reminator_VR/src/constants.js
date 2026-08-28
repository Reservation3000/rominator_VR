export const serverURL = "http://localhost:8081/api/VRmgDB/data";
export const imageProxyURL = "http://localhost:8081/api/proxy/image";

export const menuMgCardsSize= 160;          //歌曲選單每首歌曲的大小
export const menuCertenCircleSize= 30;     //歌曲選單中，歌曲中央圓圈大小

//遊戲範圍配置
export const seatRadius = 1.5;                         //座位半徑                       //改這裡動全部
export const gameAreaRingRadiusIn = 3.9;                //遊戲範圍_環_內圈半徑
export const gameAreaRingRadiusOut = 3.93;              //遊戲範圍_環_外圈半徑
export const seatRingRadiusIn =  seatRadius;            //座位_環_內圈半徑
export const seatRingRadiusOut = seatRadius + 0.01;     //座位_環_外圈半徑

//玩家位置配置
export const playerMarkIn = seatRadius + 0.05;              //玩家位置_環_內圈半徑
export const playerMarkOut = seatRadius + 0.1;          //玩家位置_環_外圈半徑

// 音符配置
export const startPosition = 3.8;           //起始位置 + 遊戲範圍
export const endPosition = seatRadius + 0.15 ;            //結束判定位置

export const perfectRange = 13;           //perfect 判定範圍
export const goodRange = 25;              //good 判定範圍