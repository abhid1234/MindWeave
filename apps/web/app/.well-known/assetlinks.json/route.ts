import { NextResponse } from 'next/server';

export async function GET() {
  const assetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.mindweave.app',
        sha256_cert_fingerprints: [
          'CF:5E:A2:00:29:60:3B:94:74:3F:10:23:90:30:73:0A:A8:F4:A4:F4:E9:F1:5C:8E:5E:11:C1:2B:85:76:3E:63',
        ],
      },
    },
  ];

  return NextResponse.json(assetLinks, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
