import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'GooseJobs — AI Job Application Copilot'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#13100a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '72px 80px',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Left amber accent bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: '#f59e0b', borderRadius: '0 3px 3px 0' }} />

        {/* Background watermark text */}
        <div style={{
          position: 'absolute',
          right: '-20px',
          top: '-40px',
          fontSize: '280px',
          fontWeight: 900,
          color: '#1e1810',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          userSelect: 'none',
        }}>
          GJ
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
          {/* Logo badge + app name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 900,
              color: '#13100a',
              flexShrink: 0,
            }}>
              G
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#f2e4cf', letterSpacing: '-0.01em' }}>
                GooseJobs
              </span>
              <span style={{ fontSize: '13px', color: '#6b5a45', marginTop: '2px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Private Beta
              </span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ fontSize: '62px', fontWeight: 800, color: '#f2e4cf', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '24px' }}>
            Your AI job<br />
            <span style={{ color: '#f59e0b' }}>application copilot</span>
          </div>

          {/* Description */}
          <div style={{ fontSize: '22px', color: '#9a8570', fontWeight: 400, lineHeight: 1.5, marginBottom: '48px', maxWidth: '760px' }}>
            Track applications · Generate tailored resumes &amp; cover letters · Prep for interviews
          </div>

          {/* Feature chips */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {['AI Resume Tailoring', 'Pipeline Tracking', 'Cover Letters', 'Interview Prep'].map((f) => (
              <div key={f} style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: '1px solid #2a2018',
                background: '#1a1510',
                fontSize: '14px',
                color: '#9a8570',
                fontWeight: 500,
              }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
