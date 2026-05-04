/* === Variation 2: Tech Index ===
   모노스페이스 디테일, 인덱스 번호, 서브틀 그리드, 터미널 같은 정밀함 */

window.V2TechIndex = (function() {
  const { useState, useEffect } = React;

  // ── Browser-style tabbed status panel ─────────────────────────
  const STATUS_TABS = [
    {
      id: 'status',
      label: 'status.md',
      cmd: '$ kobot status',
      lines: [
        ['CLUB', null],
        ['  established',     '2018'],
        ['  members.active',  '47'],
        ['  members.alumni',  '86'],
        ['  location',        '과학기술관 310호'],
        [],
        ['TRACKS', null],
        ['  [01] ros·robotics',   '12 enrolled'],
        ['  [02] embedded·iot',    '8 enrolled'],
        ['  [03] computer·vision','10 enrolled'],
        ['  [04] web·integration', '7 enrolled'],
      ],
    },
    {
      id: 'notice',
      label: 'notice.log',
      cmd: '$ tail -n 8 notice.log',
      lines: [
        ['PINNED', null],
        ['  ★ 2026 상반기 신입 부원 모집',  '02/15'],
        ['  ★ ROS 2 Navigation 세미나',     '02/14'],
        [],
        ['RECENT', null],
        ['  · 국제 로봇 경진대회 참가 안내', '02/13'],
        ['  · 정기 총회 (2/20 19:00)',       '02/12'],
        ['  · 프로젝트 중간 발표회',         '02/10'],
        ['  · 동아리방 이용 규칙 v3',        '02/08'],
        [],
        ['→ /notice', null],
      ],
    },
    {
      id: 'recruit',
      label: 'recruit.json',
      cmd: '$ kobot recruit --status',
      lines: [
        ['RECRUITMENT', null],
        ['  status',     'OPEN', 'good'],
        ['  deadline',   '2026.03.10'],
        ['  spots',      '15'],
        ['  applied',    '32 / 60'],
        [],
        ['REQUIREMENTS', null],
        ['  major',       'any · 비전공자 환영'],
        ['  year',        '1 ~ 4학년'],
        ['  commitment',  '주 4시간'],
        [],
        ['NEXT STEP', null],
        ['  → cd /recruit && submit'],
      ],
    },
  ];

  const StatusStack = () => {
    const [active, setActive] = useState(0);
    const [auto, setAuto] = useState(true);

    useEffect(() => {
      if (!auto) return;
      const id = setInterval(() => {
        setActive(a => (a + 1) % STATUS_TABS.length);
      }, 4500);
      return () => clearInterval(id);
    }, [auto]);

    const current = STATUS_TABS[active];

    return (
      <div
        onMouseEnter={() => setAuto(false)}
        onMouseLeave={() => setAuto(true)}
        style={{
          background: 'var(--ink-900)',
          borderRadius: 10,
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 30px 60px -20px rgba(8, 32, 88, 0.5), 0 0 0 1px rgba(255,255,255,0.06)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          minHeight: 460
        }}
      >
        {/* Browser chrome — traffic lights + tab strip */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          background: '#0a0a0a',
          padding: '10px 14px 0',
          gap: 4, position: 'relative'
        }}>
          <div style={{ display: 'flex', gap: 6, paddingBottom: 10, marginRight: 10 }}>
            <span style={{ width: 11, height: 11, borderRadius: 6, background: '#ff5f57' }} />
            <span style={{ width: 11, height: 11, borderRadius: 6, background: '#febc2e' }} />
            <span style={{ width: 11, height: 11, borderRadius: 6, background: '#28c840' }} />
          </div>

          {STATUS_TABS.map((tab, i) => {
            const isActive = i === active;
            return (
              <button
                key={tab.id}
                onClick={() => { setActive(i); setAuto(false); setTimeout(() => setAuto(true), 8000); }}
                style={{
                  position: 'relative',
                  padding: '8px 16px 10px',
                  fontFamily: 'inherit', fontSize: 12,
                  background: isActive ? 'var(--ink-900)' : 'transparent',
                  color: isActive ? '#e7e7e3' : '#666',
                  border: 0,
                  borderTopLeftRadius: 8, borderTopRightRadius: 8,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  minWidth: 110,
                  transition: 'color 200ms, background 200ms',
                  marginBottom: -1, zIndex: isActive ? 2 : 1
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: 3,
                  background: isActive ? '#7ab8ff' : '#444',
                  transition: 'background 200ms'
                }} />
                <span>{tab.label}</span>
                {isActive && (
                  <span style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0,
                    height: 2, background: '#7ab8ff'
                  }} />
                )}
              </button>
            );
          })}

          {/* + new tab indicator */}
          <span style={{
            color: '#444', padding: '8px 10px 10px', fontSize: 14,
            marginLeft: 'auto', paddingRight: 4
          }}>+</span>
        </div>

        {/* Content body — keyed so it cross-fades on tab change */}
        <div key={current.id} style={{
          color: '#e7e7e3', padding: 24,
          fontSize: 12.5, lineHeight: 1.85,
          flex: 1,
          animation: 'tabIn 360ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}>
          <div style={{ color: '#9a9a98', marginBottom: 14 }}>
            {current.cmd}
            <span style={{ marginLeft: 6, color: '#7ab8ff', animation: 'blink 1s infinite' }}>▊</span>
          </div>
          {current.lines.map((line, idx) => {
            if (line.length === 0) return <div key={idx} style={{ height: 6 }} />;
            const [k, v, kind] = line;
            const isHeader = v === null;
            if (isHeader) {
              return (
                <div key={idx} style={{
                  color: '#7ab8ff',
                  marginTop: idx > 0 ? 10 : 0,
                  marginBottom: 4
                }}>
                  {k} {'─'.repeat(Math.max(0, 38 - k.length))}
                </div>
              );
            }
            return (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between',
                color: '#e7e7e3'
              }}>
                <span>{k}</span>
                <span style={{ color: kind === 'good' ? '#7ab8ff' : '#bdbdbb' }}>{v}</span>
              </div>
            );
          })}
        </div>

        {/* Status bar */}
        <div style={{
          background: '#0a0a0a',
          padding: '6px 14px',
          fontSize: 10, color: '#666',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid #1a1a1a'
        }}>
          <span>tab {active + 1} / {STATUS_TABS.length}</span>
          <span style={{ display: 'flex', gap: 6 }}>
            {STATUS_TABS.map((_, j) => (
              <span key={j} style={{
                width: 16, height: 2,
                background: j === active ? '#7ab8ff' : '#222',
                transition: 'background 300ms'
              }} />
            ))}
          </span>
        </div>
      </div>
    );
  };

  const Header = () => (
    <header style={{
      borderBottom: '1px solid var(--hairline)',
      padding: '14px 40px',
      display: 'grid', gridTemplateColumns: '200px 1fr 200px',
      alignItems: 'center',
      background: 'var(--paper)',
      fontFamily: 'var(--font-mono)', fontSize: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="assets/wordLogo.png" alt="Kookmin Robot"
             style={{ height: 22, width: 'auto', display: 'block' }} />
      </div>
      <nav style={{ display: 'flex', gap: 28, justifyContent: 'center', color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11 }}>
        <a>/about</a><a>/activities</a><a>/projects</a><a>/notice</a><a>/recruit</a>
      </nav>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, fontSize: 11, color: 'var(--ink-500)' }}>
        <span>v3.2</span><span>·</span><span style={{ color: 'var(--navy-800)' }}>● online</span>
      </div>
    </header>
  );

  const gridBg = {
    backgroundImage: 'linear-gradient(var(--hairline-2) 1px, transparent 1px), linear-gradient(90deg, var(--hairline-2) 1px, transparent 1px)',
    backgroundSize: '32px 32px',
    backgroundPosition: '-1px -1px'
  };

  const Landing = () => (
    <div className="kb-root" style={{ background: 'var(--paper)', minHeight: '100%' }}>
      <Header />
      <section style={{ ...gridBg, padding: '80px 40px', minHeight: 'calc(100vh - 50px)' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          {/* breadcrumb */}
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 56 }}>
            <span style={{ color: 'var(--navy-800)' }}>~/kobot</span>
            <span style={{ margin: '0 8px' }}>$</span>
            <span>cat README.md</span>
            <span style={{ marginLeft: 8, animation: 'blink 1s infinite' }}>▊</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64, alignItems: 'start' }}>
            <div>
              <h1 className="display" style={{
                margin: 0, color: 'var(--ink-900)',
                fontWeight: 700, letterSpacing: '-0.045em',
                lineHeight: 0.88
              }}>
                <span style={{
                  display: 'block', fontSize: 12, fontWeight: 500,
                  color: 'var(--ink-500)', letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: 28,
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span style={{ color: 'var(--navy-800)' }}>● </span>
                  Kookmin · Robotics · Club
                </span>
                <span style={{
                  display: 'block',
                  fontSize: 88, fontWeight: 300,
                  color: 'var(--ink-700)',
                  letterSpacing: '-0.035em',
                  fontStyle: 'italic'
                }}>Build,</span>
                <span style={{
                  display: 'block',
                  fontSize: 88, fontWeight: 300,
                  color: 'var(--ink-700)',
                  letterSpacing: '-0.035em',
                  fontStyle: 'italic',
                  marginBottom: 6
                }}>Deploy &amp; Run</span>
                <span style={{
                  display: 'block',
                  fontSize: 184, lineHeight: 0.85,
                  fontWeight: 800, letterSpacing: '-0.07em',
                  color: 'var(--navy-800)',
                  marginLeft: -6
                }}>KOBOT.</span>
              </h1>

              <p className="mono" style={{ fontSize: 14, color: 'var(--ink-700)', maxWidth: 560, lineHeight: 1.8, marginTop: 36 }}>
                {'> '}국민대 소프트웨어융합대학 로봇 학술 동아리.<br/>
                {'> '}Kookmin Robotics Club.<br/>
                {'> '}로봇 · 개발 · 연구 · IoT.
              </p>

              <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
                <button className="mono" style={{
                  padding: '14px 24px', background: 'var(--ink-900)', color: 'var(--paper)',
                  border: 0, fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', cursor: 'pointer'
                }}>$ apply --recruit-2026</button>
                <button className="mono" style={{
                  padding: '14px 24px', background: 'transparent', color: 'var(--ink-900)',
                  border: '1px solid var(--ink-900)', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', cursor: 'pointer'
                }}>$ ls activities/</button>
              </div>
            </div>

            {/* status card stack — auto-cycling */}
            <StatusStack />
          </div>

          {/* footer strip */}
          <div className="mono" style={{
            marginTop: 80, paddingTop: 24,
            borderTop: '1px dashed var(--ink-300)',
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, fontSize: 12
          }}>
            {[
              ['[ROS]',     'Navigation, MoveIt, Gazebo'],
              ['[EMBED]',   'STM32, Arduino, RTOS'],
              ['[VISION]',  'OpenCV, YOLO, PyTorch'],
              ['[WEB]',     'React, FastAPI, ROS Bridge'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ color: 'var(--navy-800)', fontWeight: 600, marginBottom: 8 }}>{k}</div>
                <div style={{ color: 'var(--ink-500)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const Activities = () => {
    const items = [
      ['047', '2026.02.15', 'WORKSHOP', 'ROS2 워크샵 — 자율주행 시뮬레이션', 'ros'],
      ['046', '2026.02.08', 'STUDY',    'ARM Cortex-M 임베디드 스터디',     'embed'],
      ['045', '2026.02.01', 'AWARD',    '2026 Winter Hackathon — 우수상',     'event'],
      ['044', '2026.01.25', 'SEMINAR',  'Arduino 입문 세미나',               'embed'],
      ['043', '2026.01.18', 'PROJECT',  '6축 로봇팔 제어 — MoveIt 연동',     'ros'],
      ['042', '2026.01.12', 'STUDY',    'Python 알고리즘 코딩 세션',         'study'],
      ['041', '2025.12.20', 'TOUR',     '로보틱스 랩 견학',                  'event'],
      ['040', '2025.12.15', 'EVENT',    'AI Conference 2025 참관',           'event'],
    ];
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ padding: '40px', maxWidth: 1360, margin: '0 auto' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 32 }}>
            <span>~/kobot</span><span style={{ margin: '0 8px' }}>$</span>
            <span>ls -la activities/ | sort -r</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 48 }}>
            <aside>
              <h1 className="mono" style={{ fontSize: 32, margin: 0, fontWeight: 600, letterSpacing: '-0.02em' }}>
                /activities
              </h1>
              <p className="mono" style={{ fontSize: 12, color: 'var(--ink-500)', margin: '8px 0 24px' }}>
                # 47 entries · sorted by date desc
              </p>

              <div style={{ border: '1px solid var(--hairline)', padding: 16, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <div style={{ color: 'var(--ink-500)', marginBottom: 12 }}># filters</div>
                {[
                  ['all',    47, true],
                  ['ros',    12, false],
                  ['embed',   8, false],
                  ['vision', 10, false],
                  ['web',     7, false],
                  ['event',   5, false],
                  ['study',   9, false],
                ].map(([k, c, sel]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 8px', marginInline: -8,
                    background: sel ? 'var(--ink-900)' : 'transparent',
                    color: sel ? 'var(--paper)' : 'var(--ink-700)'
                  }}>
                    <span>{sel ? '> ' : '  '}{k}</span>
                    <span style={{ color: sel ? '#9a9a98' : 'var(--ink-400)' }}>[{c}]</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)', lineHeight: 1.8 }}>
                # tip<br/>
                press <span style={{ background: 'var(--paper-3)', padding: '1px 6px', color: 'var(--ink-900)' }}>/</span> to search.<br/>
                press <span style={{ background: 'var(--paper-3)', padding: '1px 6px', color: 'var(--ink-900)' }}>j/k</span> to navigate.
              </div>
            </aside>

            <div style={{ border: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '60px 100px 90px 1fr 80px',
                padding: '12px 16px', background: 'var(--paper-2)',
                borderBottom: '1px solid var(--hairline)',
                fontSize: 10, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.1em'
              }}>
                <span>№</span><span>date</span><span>kind</span><span>title</span><span style={{ textAlign: 'right' }}>links</span>
              </div>
              {items.map(([n, d, k, t]) => (
                <div key={n} style={{
                  display: 'grid', gridTemplateColumns: '60px 100px 90px 1fr 80px',
                  padding: '14px 16px', borderBottom: '1px solid var(--hairline-2)',
                  alignItems: 'center'
                }}>
                  <span style={{ color: 'var(--ink-400)' }}>{n}</span>
                  <span style={{ color: 'var(--ink-700)' }}>{d}</span>
                  <span style={{
                    fontSize: 10, padding: '2px 6px',
                    background: 'var(--navy-50)', color: 'var(--navy-800)',
                    width: 'fit-content'
                  }}>{k}</span>
                  <span className="display" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-900)' }}>{t}</span>
                  <span style={{ textAlign: 'right', color: 'var(--ink-500)', fontSize: 11 }}>↗ open</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  };

  const Projects = () => {
    const projects = [
      { id: 'P-023', t: '자율주행 로봇', desc: 'SLAM 기반 실내 네비게이션', stack: ['ROS', 'Python', 'SLAM'], status: 'active', team: 5, prog: 65 },
      { id: 'P-022', t: '6축 로봇팔 제어', desc: '역기구학 정밀 제어', stack: ['C++', 'ROS', 'MoveIt'], status: 'shipped', team: 4, prog: 100 },
      { id: 'P-021', t: '드론 자동 착륙', desc: 'ArUco 마커 비전 착륙', stack: ['OpenCV', 'PX4'], status: 'active', team: 3, prog: 40 },
      { id: 'P-020', t: '딥러닝 물체 인식', desc: 'YOLO + ROS 통합', stack: ['TF', 'YOLO', 'ROS'], status: 'active', team: 6, prog: 80 },
      { id: 'P-019', t: '협동 로봇 시스템', desc: '다중 로봇 분산 제어', stack: ['ROS2', 'DDS'], status: 'planned', team: 5, prog: 0 },
      { id: 'P-018', t: '휴머노이드 보행', desc: 'ZMP 보행 패턴 생성', stack: ['MATLAB', 'Sim'], status: 'shipped', team: 4, prog: 100 },
    ];
    const statusColor = { active: 'var(--navy-800)', shipped: 'var(--ink-500)', planned: 'var(--ink-400)' };
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ padding: '40px', maxWidth: 1360, margin: '0 auto' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 24 }}>
            ~/kobot $ git log --projects --oneline
          </div>
          <h1 className="mono" style={{ fontSize: 36, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
            /projects <span style={{ color: 'var(--ink-400)', fontWeight: 400 }}>// 23 total</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-500)', marginTop: 12, marginBottom: 40 }}>
            진행중 8 · 완료 12 · 계획 3.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {projects.map(p => (
              <article key={p.id} style={{
                border: '1px solid var(--hairline)',
                padding: 24,
                fontFamily: 'var(--font-mono)',
                fontSize: 12, position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ color: 'var(--ink-400)', fontSize: 11 }}>// {p.id}</span>
                  <span style={{ color: statusColor[p.status], fontSize: 11 }}>● {p.status}</span>
                </div>
                <h3 className="display" style={{
                  fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 600,
                  margin: '0 0 8px', letterSpacing: '-0.01em'
                }}>{p.t}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-500)', margin: '0 0 20px' }}>
                  {p.desc}
                </p>

                <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                  {p.stack.map(s => (
                    <span key={s} style={{
                      fontSize: 10, padding: '3px 8px',
                      background: 'var(--paper-2)', border: '1px solid var(--hairline)',
                      color: 'var(--ink-700)'
                    }}>{s}</span>
                  ))}
                </div>

                <div style={{ height: 4, background: 'var(--paper-3)', marginBottom: 8, position: 'relative' }}>
                  <div style={{ height: '100%', width: p.prog + '%', background: statusColor[p.status] }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-500)' }}>
                  <span>team: {p.team}</span>
                  <span>{p.prog}% complete</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const Notice = () => {
    const notices = [
      { p: true, c: 'recruit',  t: '2026년 상반기 신입 부원 모집 공고', d: '2026.02.15', preview: '4개 트랙 중 선택 지원. 비전공자 환영.' },
      { p: true, c: 'seminar',  t: 'ROS 2 Navigation Stack 고급 세미나', d: '2026.02.14', preview: 'Nav2, AMCL, costmap 심화.' },
      { p: false, c: 'event',   t: '국제 로봇 경진대회 참가 안내', d: '2026.02.13', preview: '3월 개최. 출전팀 모집.' },
      { p: false, c: 'general', t: '정기 총회 개최 안내', d: '2026.02.12', preview: '2/20 19:00, 전 부원 참석.' },
      { p: false, c: 'event',   t: '프로젝트 중간 발표회', d: '2026.02.10', preview: '진행중 프로젝트 8건 발표.' },
      { p: false, c: 'general', t: '동아리방 이용 규칙 안내', d: '2026.02.08', preview: '운영 규정 v3 업데이트.' },
    ];
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ padding: '40px', maxWidth: 1080, margin: '0 auto' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 24 }}>
            ~/kobot $ tail -n 50 notice.log
          </div>
          <h1 className="mono" style={{ fontSize: 36, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            /notice
          </h1>
          <p className="mono" style={{ fontSize: 12, color: 'var(--ink-500)', margin: '0 0 32px' }}>
            # all official announcements
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 24, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {['all', 'recruit', 'seminar', 'event', 'general'].map((t, i) => (
              <button key={t} style={{
                padding: '6px 12px',
                background: i === 0 ? 'var(--ink-900)' : 'transparent',
                color: i === 0 ? 'var(--paper)' : 'var(--ink-700)',
                border: '1px solid ' + (i === 0 ? 'var(--ink-900)' : 'var(--hairline)'),
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em'
              }}>--{t}</button>
            ))}
          </div>

          <div style={{ border: '1px solid var(--hairline)', fontFamily: 'var(--font-mono)' }}>
            {notices.map((n, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '40px 80px 1fr 110px',
                padding: '20px 20px',
                borderBottom: i < notices.length - 1 ? '1px solid var(--hairline-2)' : 0,
                alignItems: 'baseline', gap: 16,
                background: n.p ? 'var(--navy-50)' : 'transparent'
              }}>
                <span style={{ fontSize: 11, color: n.p ? 'var(--navy-800)' : 'var(--ink-400)' }}>
                  {n.p ? '[★]' : `[${String(notices.length - i).padStart(2, '0')}]`}
                </span>
                <span style={{ fontSize: 10, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {n.c}
                </span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, margin: 0 }}>{n.t}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-500)', margin: '4px 0 0' }}>{n.preview}</p>
                </div>
                <span style={{ fontSize: 11, color: 'var(--ink-500)', textAlign: 'right' }}>{n.d}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  return { Landing, Activities, Projects, Notice };
})();
