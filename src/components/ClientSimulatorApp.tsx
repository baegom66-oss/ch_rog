"use client";

import dynamic from "next/dynamic";

/** 초기 상태를 LocalStorage에서 바로 읽기 때문에 서버 렌더링 없이 브라우저에서만 그린다 */
const ClientSimulatorApp = dynamic(() => import("@/components/SimulatorApp"), {
  ssr: false,
});

export default ClientSimulatorApp;
