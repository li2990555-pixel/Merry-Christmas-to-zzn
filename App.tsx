
import React, { useState, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import HandTracker from './components/HandTracker';
import { TreeState, HandData } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.MERGED);
  const [handData, setHandData] = useState<HandData | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (handData) {
      if (handData.isFist && treeState !== TreeState.MERGED) {
        setTreeState(TreeState.MERGED);
      } else if (handData.isOpen && treeState !== TreeState.SCATTERED) {
        setTreeState(TreeState.SCATTERED);
      }
    }
  }, [handData, treeState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#051505]">
      {/* 3D 场景 */}
      <Scene3D treeState={treeState} handData={handData} />

      {/* 顶层 UI 面板 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none p-12 flex flex-col justify-between">
        
        {/* 标题 - 统一居中布局 */}
        <div className="flex flex-col items-center w-full">
          <div className="pointer-events-auto text-center">
            <h1 className="text-3xl font-serif tracking-[0.2em] text-[#FDE68A] drop-shadow-[0_0_15px_rgba(253,230,138,0.4)] leading-tight uppercase whitespace-nowrap">
              MERRY CHRISTMAS TO ZZN
            </h1>
          </div>
        </div>

        {/* 底部控制提示与摄像头预览 */}
        <div className="flex justify-between items-end">
          <div className="max-w-md">
            {/* 保持左下角清爽 */}
          </div>

          <div className="flex flex-col items-end gap-6">
            <div className="w-52 h-36 rounded-2xl border border-white/5 bg-black/40 overflow-hidden relative pointer-events-auto shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
              <HandTracker onHandUpdate={setHandData} onCameraReady={() => { setCameraActive(true); setLoading(false); }} />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#051505]/95 text-[#FDE68A] text-[8px] text-center p-4 uppercase tracking-widest animate-pulse leading-relaxed">
                  {loading ? "Igniting Gold..." : "Waiting for Gesture"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 全屏加载遮罩 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#051505]">
          <div className="flex flex-col items-center gap-10">
            <div className="relative w-12 h-12">
               <div className="absolute inset-0 border-2 border-t-[#FDE68A] border-transparent rounded-full animate-spin" />
               <div className="absolute inset-2.5 border-2 border-b-[#D97706] border-transparent rounded-full animate-spin-reverse" />
            </div>
            <p className="uppercase tracking-[0.8em] text-[9px] text-[#FDE68A] animate-pulse">Forging Golden Geometry</p>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 2.5s linear infinite;
        }
        body { background: #051505; }
      `}</style>
    </div>
  );
};

export default App;
