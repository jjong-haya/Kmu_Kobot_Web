/* === Variation 1: Editorial === 
   큰 타이포그래피, 비대칭 그리드, 얇은 hairline, 잡지스러운 위계 */

window.V1Editorial = (function() {
  const { useState } = React;

  // ── Shared chrome ─────────────────────────
  const Header = () => (
    <header style={{
      borderBottom: '1px solid var(--hairline)',
      padding: '20px 56px',
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      background: 'var(--paper)'
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span className="display" style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em' }}>
          K<span style={{ color: 'var(--navy-800)' }}>·</span>bot
        </span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          국민대 로봇 학술동아리
        </span>
      </div>
      <nav style={{ display: 'flex', gap: 32, fontSize: 14, color: 'var(--ink-700)' }}>
        <a>활동</a><a>프로젝트</a><a>공지</a><a>모집</a>
        <a style={{ color: 'var(--navy-800)', fontWeight: 600 }}>로그인 →</a>
      </nav>
    </header>
  );

  // ── Landing Hero ──────────────────────────
  const Landing = () => (
    <div className="kb-root" style={{ background: 'var(--paper)', minHeight: '100%' }}>
      <Header />
      <section style={{ padding: '72px 56px 96px', maxWidth: 1440, margin: '0 auto' }}>
        {/* Top bar — issue / date */}
        <div className="mono" style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--ink-500)', borderBottom: '1px solid var(--ink-900)',
          paddingBottom: 12, marginBottom: 56
        }}>
          <span>Vol. 14 — Spring 2026</span>
          <span>국민대학교 소프트웨어융합대학</span>
          <span>03 · 매거진</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 56, alignItems: 'end' }}>
          <div>
            <p className="mono" style={{ fontSize: 12, color: 'var(--navy-800)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>
              ─ Issue 14 / Recruiting now
            </p>
            <h1 className="display" style={{
              fontSize: 128, lineHeight: 0.92, fontWeight: 600,
              letterSpacing: '-0.045em', margin: 0, color: 'var(--ink-900)'
            }}>
              We build<br/>
              <span className="serif" style={{ fontStyle: 'italic', fontWeight: 400, fontSize: 132 }}>robots</span><br/>
              that move.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 520, marginTop: 40, color: 'var(--ink-700)' }}>
              ROS · 임베디드 · 컴퓨터 비전 · 웹 통합. 네 개의 트랙, 한 학기의 미니프로젝트, 한 번의 데모데이.
            </p>
          </div>

          <aside style={{ borderLeft: '1px solid var(--hairline)', paddingLeft: 32 }}>
            <div className="mono kb-uppercase" style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 16 }}>
              In this issue
            </div>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14 }}>
              {[
                ['01', '신입 부원 모집', 'D-5'],
                ['02', '데모데이 회고', '2/05'],
                ['03', 'ROS 워크샵 진행', '2/12'],
                ['04', '해커톤 위크 안내', '2/25'],
              ].map(([n, t, m]) => (
                <li key={n} style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr auto',
                  padding: '14px 0', borderBottom: '1px solid var(--hairline)',
                  alignItems: 'baseline', gap: 12
                }}>
                  <span className="mono" style={{ color: 'var(--ink-400)' }}>{n}</span>
                  <span>{t}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{m}</span>
                </li>
              ))}
            </ol>
            <button style={{
              marginTop: 24, width: '100%', padding: '14px 20px',
              background: 'var(--ink-900)', color: 'var(--paper)',
              border: 0, fontSize: 14, fontWeight: 500, letterSpacing: '0.02em',
              display: 'flex', justifyContent: 'space-between', cursor: 'pointer'
            }}>
              <span>지원하기</span><span>→</span>
            </button>
          </aside>
        </div>

        {/* Lower meta strip */}
        <div style={{
          marginTop: 96, paddingTop: 24, borderTop: '1px solid var(--ink-900)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 56
        }}>
          {[
            ['Active members', '47', '재학·졸업 부원'],
            ['Projects shipped', '23', '2020년부터'],
            ['Awards', '12', '국내·국제 대회'],
            ['Founded', '2018', '소프트웨어융합대'],
          ].map(([k, v, s]) => (
            <div key={k}>
              <div className="mono kb-uppercase" style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 16 }}>{k}</div>
              <div className="display" style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 8 }}>{s}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  // ── Activities ─────────────────────────────
  const Activities = () => {
    const items = [
      { n: '01', t: 'ROS2 워크샵 — 자율주행 시뮬레이션', d: '2026.02.15', tag: 'WORKSHOP', big: true },
      { n: '02', t: 'ARM Cortex-M 임베디드 스터디',     d: '2026.02.08', tag: 'STUDY' },
      { n: '03', t: '2026 Winter Hackathon · 우수상',   d: '2026.02.01', tag: 'AWARD', big: true },
      { n: '04', t: 'Arduino 입문 세미나',               d: '2026.01.25', tag: 'SEMINAR' },
      { n: '05', t: '6축 로봇팔 제어 프로젝트',           d: '2026.01.18', tag: 'PROJECT', big: true },
      { n: '06', t: 'Python 알고리즘 코딩 세션',          d: '2026.01.12', tag: 'STUDY' },
    ];
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ padding: '64px 56px', maxWidth: 1440, margin: '0 auto' }}>
          <div className="mono kb-uppercase" style={{ fontSize: 11, color: 'var(--ink-500)', borderBottom: '1px solid var(--ink-900)', paddingBottom: 12 }}>
            <span style={{ marginRight: 32 }}>Section · Activities</span>
            <span style={{ marginRight: 32 }}>총 47건</span>
            <span style={{ float: 'right' }}>2026 → 2024</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 4fr', gap: 56, marginTop: 48 }}>
            {/* sidebar */}
            <aside>
              <h2 className="display" style={{ fontSize: 56, lineHeight: 0.95, fontWeight: 500, letterSpacing: '-0.03em', margin: 0 }}>
                활동<br/>아카이브
              </h2>
              <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 16, lineHeight: 1.6 }}>
                매주의 스터디, 매학기의 프로젝트, 매년의 대회. 2018년부터 쌓인 기록.
              </p>
              <div style={{ marginTop: 32 }}>
                <div className="mono kb-uppercase" style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 12 }}>Filter</div>
                {['전체', 'ROS', '임베디드', '비전', '웹·통합', '대회', '세미나'].map((t, i) => (
                  <div key={t} style={{
                    padding: '10px 0', borderBottom: '1px solid var(--hairline)',
                    fontSize: 14, display: 'flex', justifyContent: 'space-between',
                    color: i === 0 ? 'var(--ink-900)' : 'var(--ink-700)',
                    fontWeight: i === 0 ? 600 : 400
                  }}>
                    <span>{t}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{[47, 12, 8, 7, 5, 9, 6][i]}</span>
                  </div>
                ))}
              </div>
            </aside>

            {/* feed */}
            <div>
              <div className="mono kb-uppercase" style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 24 }}>
                ── 2026년 02월
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
                {items.map((it, i) => (
                  <article key={it.n} style={{
                    gridColumn: it.big ? 'span 4' : 'span 2',
                    borderTop: '1px solid var(--ink-900)',
                    paddingTop: 16
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-500)' }}>№ {it.n} · {it.tag}</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{it.d}</span>
                    </div>
                    <div style={{
                      aspectRatio: it.big ? '16/9' : '4/5',
                      background: 'var(--paper-3)',
                      backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,0.03) 14px 15px)',
                      marginBottom: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>[ photo ]</span>
                    </div>
                    <h3 className={it.big ? 'display' : ''} style={{
                      fontSize: it.big ? 28 : 17, lineHeight: 1.25,
                      letterSpacing: it.big ? '-0.02em' : 0,
                      fontWeight: it.big ? 500 : 600,
                      margin: 0, textWrap: 'pretty'
                    }}>{it.t}</h3>
                    {it.big && (
                      <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 12, lineHeight: 1.55 }}>
                        Read more →
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // ── Projects ───────────────────────────────
  const Projects = () => {
    const projects = [
      { n: '01', t: '자율주행 로봇', desc: 'SLAM 기반 실내 네비게이션', tags: 'ROS · Python · SLAM', team: 5, status: '진행중', period: '25.09 →' },
      { n: '02', t: '6축 로봇팔 제어', desc: '역기구학 정밀 제어 시스템', tags: 'C++ · ROS · Kinematics', team: 4, status: '완료', period: '25.03 — 25.08' },
      { n: '03', t: '드론 자동 착륙', desc: '컴퓨터 비전 기반 정밀 착륙', tags: 'OpenCV · ArduPilot', team: 3, status: '진행중', period: '25.11 →' },
      { n: '04', t: '딥러닝 물체 인식', desc: 'YOLO 실시간 인식 + ROS 통합', tags: 'TensorFlow · YOLO · ROS', team: 6, status: '진행중', period: '25.09 →' },
      { n: '05', t: '협동 로봇 시스템', desc: '다중 로봇 분산 제어', tags: 'ROS2 · DDS · Multi-Agent', team: 5, status: '계획중', period: '26.03 —' },
    ];
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ padding: '64px 56px', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, marginBottom: 64, alignItems: 'end' }}>
            <h1 className="display" style={{ fontSize: 96, lineHeight: 0.95, fontWeight: 500, letterSpacing: '-0.04em', margin: 0 }}>
              <span className="serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>Selected</span><br/>
              projects.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--ink-500)', maxWidth: 480, justifySelf: 'end', textAlign: 'right' }}>
              매학기 8–12개의 팀 프로젝트가 진행됩니다. 일부는 대회로, 일부는 논문으로, 대부분은 다음 학기의 토대로.
            </p>
          </div>

          {/* Index table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderTop: '1px solid var(--ink-900)', borderBottom: '1px solid var(--ink-900)' }}>
                {['№', 'Title', 'Description', 'Stack', 'Team', 'Status', 'Period'].map((h, i) => (
                  <th key={h} className="mono kb-uppercase" style={{
                    textAlign: i > 3 ? 'right' : 'left',
                    fontSize: 10, color: 'var(--ink-500)',
                    padding: '14px 12px', fontWeight: 500
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.n} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td className="mono" style={{ padding: '24px 12px', color: 'var(--ink-400)', fontSize: 13, verticalAlign: 'top', width: 56 }}>{p.n}</td>
                  <td style={{ padding: '24px 12px', verticalAlign: 'top' }}>
                    <div className="display" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}>{p.t}</div>
                  </td>
                  <td style={{ padding: '24px 12px', verticalAlign: 'top', fontSize: 14, color: 'var(--ink-700)', maxWidth: 280 }}>{p.desc}</td>
                  <td className="mono" style={{ padding: '24px 12px', verticalAlign: 'top', fontSize: 12, color: 'var(--ink-500)' }}>{p.tags}</td>
                  <td className="mono" style={{ padding: '24px 12px', verticalAlign: 'top', fontSize: 13, textAlign: 'right' }}>{p.team}명</td>
                  <td style={{ padding: '24px 12px', verticalAlign: 'top', textAlign: 'right' }}>
                    <span style={{
                      fontSize: 11, padding: '4px 10px',
                      border: '1px solid ' + (p.status === '진행중' ? 'var(--navy-800)' : 'var(--hairline)'),
                      color: p.status === '진행중' ? 'var(--navy-800)' : 'var(--ink-700)',
                      fontWeight: 500
                    }}>{p.status}</span>
                  </td>
                  <td className="mono" style={{ padding: '24px 12px', verticalAlign: 'top', fontSize: 12, color: 'var(--ink-500)', textAlign: 'right' }}>{p.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  };

  // ── Notice ─────────────────────────────────
  const Notice = () => {
    const notices = [
      { p: true, c: '모집', t: '2026년 상반기 신입 부원 모집 공고', d: '2026.02.15', preview: '로봇에 관심있는 모든 학생 환영합니다. 4개 트랙 중 선택 지원.' },
      { p: true, c: '세미나', t: 'ROS 2 Navigation Stack 고급 세미나', d: '2026.02.14', preview: 'Nav2, AMCL, costmap 심화 세션.' },
      { p: false, c: '행사', t: '국제 로봇 경진대회 참가 안내', d: '2026.02.13', preview: '3월 개최. 출전팀 모집.' },
      { p: false, c: '일반', t: '정기 총회 개최 안내', d: '2026.02.12', preview: '2/20 19:00, 전 부원 참석.' },
      { p: false, c: '행사', t: '프로젝트 중간 발표회', d: '2026.02.10', preview: '진행중 프로젝트 8건.' },
      { p: false, c: '일반', t: '동아리방 이용 규칙 안내', d: '2026.02.08', preview: '운영 규정 v3 업데이트.' },
    ];
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ padding: '64px 56px', maxWidth: 980, margin: '0 auto' }}>
          <div className="mono kb-uppercase" style={{ fontSize: 11, color: 'var(--ink-500)', borderBottom: '1px solid var(--ink-900)', paddingBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>Notice / Bulletin</span>
            <span>↳ 2026 / 02</span>
          </div>

          <h1 className="display" style={{ fontSize: 88, fontWeight: 500, letterSpacing: '-0.04em', margin: '40px 0 16px', lineHeight: 0.95 }}>
            공지<span className="serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>사항</span>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-500)', maxWidth: 540, marginBottom: 56 }}>
            동아리의 모든 공식 발표.
          </p>

          {/* search */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 48, alignItems: 'center', borderBottom: '1px solid var(--ink-900)', paddingBottom: 12 }}>
            <span className="mono kb-uppercase" style={{ fontSize: 10, color: 'var(--ink-500)' }}>Search</span>
            <input placeholder="검색어를 입력" style={{
              flex: 1, border: 0, outline: 'none', fontSize: 16, background: 'transparent',
              fontFamily: 'var(--font-body)'
            }} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>⌘K</span>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notices.map((n, i) => (
              <li key={i} style={{
                display: 'grid', gridTemplateColumns: '40px 80px 1fr 100px',
                padding: '24px 0', borderBottom: '1px solid var(--hairline)',
                alignItems: 'baseline', gap: 16,
                background: n.p ? 'var(--paper-2)' : 'transparent',
                marginInline: n.p ? -16 : 0, paddingInline: n.p ? 16 : 0
              }}>
                <span className="mono" style={{ fontSize: 11, color: n.p ? 'var(--navy-800)' : 'var(--ink-400)' }}>
                  {n.p ? '★' : String(i + 1).padStart(2, '0')}
                </span>
                <span className="mono kb-uppercase" style={{ fontSize: 10, color: 'var(--ink-500)' }}>{n.c}</span>
                <div>
                  <h3 className="display" style={{ fontSize: 20, fontWeight: 500, margin: 0, letterSpacing: '-0.01em' }}>{n.t}</h3>
                  <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 6, marginBottom: 0 }}>{n.preview}</p>
                </div>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'right' }}>{n.d}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  };

  return { Landing, Activities, Projects, Notice };
})();
