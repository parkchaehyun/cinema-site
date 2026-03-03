import React from 'react';
import { useGeo } from '../hooks/useGeo';

function sourceLabelKo(source) {
  if (source === 'ip') return '현재 대략적인 위치(IP 기준)로 표시하고 있어요.';
  if (source === 'cache') return '최근에 확인한 위치 기준으로 표시하고 있어요.';
  return '기본 위치(서울) 기준으로 표시하고 있어요.';
}

export default function LocationStatusBar() {
  const { source, permissionState } = useGeo();
  const hasPreciseLocation = source === 'gps';

  if (hasPreciseLocation) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-gray-900">정확한 거리 안내를 위해 위치 권한을 켜 주세요.</p>
      <p className="mt-1 text-xs text-gray-700">{sourceLabelKo(source)}</p>
      {permissionState === 'denied' ? (
        <p className="mt-1 text-xs text-gray-700">
          브라우저/맥 설정에서 위치 권한을 허용한 뒤, 이 페이지를 새로고침해 주세요.
        </p>
      ) : (
        <p className="mt-1 text-xs text-gray-700">
          위치 권한을 허용하고 새로고침하면 GPS 기준으로 정확한 거리가 보여요.
        </p>
      )}
    </div>
  );
}
