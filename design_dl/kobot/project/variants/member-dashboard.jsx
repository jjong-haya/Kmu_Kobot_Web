/* === Member Dashboard — 좌측 사이드바, 활동/프로젝트 관리 ===
   V1 Editorial 톤을 베이스로 삼되, 사이드바는 codebase의 256px 구조를 따른다. */

window.MemberDashboard = (function() {
  // ── Sidebar ─────────────────────────────────
  const NavItem = ({ icon, label, active, badge }) => (
    <a style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 12px', borderRadius: 8, fontSize: 13.5,
      cursor: 'pointer',
      background: active ? 'var(--navy-800)' : 'transparent',
      color: active ? 'var(--paper)' : 'var(--ink-700)',
      fontWeight: active ? 500 : 400, position: 'relative'
    }}>
      <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center', opacity: active ? 1 : 0.7 }}>{icon}</span>
      <span>{label}</span>
      {badge && (
        <span style={{
          marginLeft: 'auto', fontSize: 11, padding: '1px 6px', borderRadius: 4,
          background: active ? 'rgba(255,255,255,0.2)' : 'var(--paper-3)',
          color: active ? 'var(--paper)' : 'var(--ink-700)', fontWeight: 600
        }}>{badge}</span>
      )}
    </a>
  );
  const SectionLabel = ({ children }) => (
    <h3 style={{
      padding: '0 12px', margin: '0 0 8px',
      fontSize: 10.5, fontWeight: 600, color: 'var(--ink-500)',
      textTransform: 'uppercase', letterSpacing: '0.08em'
    }}>{children}</h3>
  );

  const Sidebar = ({ active = 'dashboard' }) => (
    <aside style={{
      width: 256, background: 'var(--paper)',
      borderRight: '1px solid var(--hairline)',
      display: 'flex', flexDirection: 'column',
      height: '100%', position: 'sticky', top: 0
    }}>
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 24px', borderBottom: '1px solid var(--hairline)'
      }}>
        <span style={{
          width: 26, height: 26, background: 'var(--navy-900)',
          borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--paper)', fontWeight: 700, fontSize: 14
        }}>K</span>
        <span className="display" style={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: 18 }}>kobot</span>
        <span style={{ fontSize: 10, color: 'var(--ink-400)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>v3.2</span>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Overview</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem icon="◇" label="Dashboard" active={active === 'dashboard'} />
            <NavItem icon="○" label="Notifications" badge="3" />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Communication</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem icon="!" label="Announcements" />
            <NavItem icon="?" label="Q&A" />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Learning</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem icon="≡" label="Study Log" />
            <NavItem icon="▤" label="Study Playlist" />
            <NavItem icon="◐" label="Peer Review" />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Projects</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem icon="◫" label="Projects" active={active === 'projects'} />
            <NavItem icon="▦" label="Showcase" />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Events &amp; People</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem icon="□" label="Events" />
            <NavItem icon="◷" label="Office Hours" />
            <NavItem icon="△" label="Members" />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Resources</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem icon="▢" label="Resources" />
            <NavItem icon="▸" label="Templates" />
            <NavItem icon="◰" label="Equipment" />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Management</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem icon="◉" label="Roadmap" />
            <NavItem icon="◍" label="Retrospective" />
            <NavItem icon="◊" label="Changelog" />
          </div>
        </div>
        <div>
          <SectionLabel>Admin</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem icon="✎" label="Forms" />
            <NavItem icon="↔" label="Integrations" />
            <NavItem icon="⚙" label="Permissions" />
          </div>
        </div>
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid var(--hairline)' }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '8px 10px', borderRadius: 8,
          background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left'
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: 16, background: 'var(--navy-800)',
            color: 'var(--paper)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600
          }}>JD</span>
          <span style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>John Doe</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>Member · ROS</div>
          </span>
          <span style={{ color: 'var(--ink-400)', fontSize: 12 }}>⋯</span>
        </button>
      </div>
    </aside>
  );

  // ── TopBar ──────────────────────────────────
  const TopBar = ({ title, breadcrumb }) => (
    <header style={{
      height: 64, borderBottom: '1px solid var(--hairline)',
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 32px',
      background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 5
    }}>
      <div style={{ flex: 1, maxWidth: 480 }}>
        <button style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px', background: 'var(--paper-2)',
          border: '1px solid var(--hairline)', borderRadius: 8,
          fontSize: 13, color: 'var(--ink-500)', cursor: 'pointer', fontFamily: 'inherit'
        }}>
          <span>⌕</span>
          <span>Search everywhere…</span>
          <span className="mono" style={{
            marginLeft: 'auto', padding: '1px 6px', background: 'var(--paper)',
            border: '1px solid var(--hairline)', borderRadius: 4, fontSize: 10.5
          }}>⌘K</span>
        </button>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'transparent', border: 0, cursor: 'pointer', position: 'relative'
        }}>
          <span style={{ fontSize: 16 }}>⚐</span>
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 16, height: 16, borderRadius: 8, fontSize: 10, fontWeight: 700,
            background: '#ef4444', color: 'var(--paper)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
          }}>3</span>
        </button>
        <button style={{
          width: 36, height: 36, borderRadius: 18, background: 'var(--navy-800)',
          color: 'var(--paper)', border: 0, fontSize: 12, fontWeight: 600, cursor: 'pointer'
        }}>JD</button>
      </div>
    </header>
  );

  // ── Atoms ────────────────────────────────────
  const Card = ({ children, style }) => (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--hairline)',
      borderRadius: 12, ...style
    }}>{children}</div>
  );
  const CardHeader = ({ title, action }) => (
    <div style={{
      padding: '16px 20px', borderBottom: '1px solid var(--hairline-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{title}</h3>
      {action}
    </div>
  );

  // ── Dashboard page ───────────────────────────
  const Dashboard = () => {
    const kpis = [
      ['출석률',         '94%',  '+2% MoM',   'var(--navy-800)'],
      ['이번 달 세션',   '8회',  '4회 남음',  'var(--ink-700)'],
      ['진행중 프로젝트', '2개', '1개 완료',  'var(--ink-700)'],
      ['마감 임박 과제', '1개',  'D-3',       '#ef4444'],
    ];
    const events = [
      ['2/18', '19:00', 'ROS 2 Navigation 세미나', '세미나'],
      ['2/20', '18:00', '프로젝트 중간 발표',     '발표'],
      ['2/22', '19:00', '정기 총회',              '회의'],
    ];
    const todos = [
      ['컴퓨터 비전 과제 제출',  '2/18', 'high'],
      ['프로젝트 문서 작성',     '2/20', 'medium'],
      ['세미나 자료 준비',       '2/25', 'low'],
    ];
    const notices = [
      ['모집',   '2026년 상반기 신입 부원 모집 공고', '2/15'],
      ['세미나', 'ROS 2 고급 세미나 안내',            '2/14'],
      ['행사',   '국제 로봇 경진대회 참가 안내',      '2/13'],
    ];
    const resources = [
      ['PDF',   'ROS 2 Navigation Stack 가이드', '2/14'],
      ['ZIP',   '자율주행 프로젝트 코드',         '2/13'],
      ['VIDEO', '로봇팔 제어 시뮬레이션',         '2/12'],
    ];
    const projects = [
      ['자율주행 로봇 개발',     '소프트웨어', '진행중', 65],
      ['딥러닝 기반 물체 인식',  'AI 개발',   '진행중', 40],
    ];
    const priorityColor = { high: '#ef4444', medium: 'var(--navy-800)', low: 'var(--ink-400)' };

    return (
      <div className="kb-root" style={{ display: 'flex', minHeight: '100%', background: 'var(--paper-2)' }}>
        <Sidebar active="dashboard" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar />
          <main style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                  member / dashboard
                </div>
                <h1 className="display" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
                  안녕하세요, John 👋
                </h1>
                <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: '6px 0 0' }}>
                  오늘은 2026년 2월 17일 화요일. 마감 임박 과제 1건이 있어요.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{
                  padding: '9px 14px', border: '1px solid var(--hairline)',
                  background: 'var(--paper)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer'
                }}>활동 기록</button>
                <button style={{
                  padding: '9px 14px', border: 0, background: 'var(--navy-800)', color: 'var(--paper)',
                  borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer'
                }}>+ 새 프로젝트</button>
              </div>
            </div>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {kpis.map(([t, v, s, c]) => (
                <Card key={t} style={{ padding: 20 }}>
                  <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: 0 }}>{t}</p>
                  <p className="display" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', margin: '6px 0 4px' }}>{v}</p>
                  <p style={{ fontSize: 12, color: c, margin: 0, fontWeight: 500 }}>{s}</p>
                </Card>
              ))}
            </div>

            {/* Quick actions */}
            <Card style={{ borderColor: 'var(--navy-200)' }}>
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    ['✎',  'Write Study Log',  '오늘 배운 것 기록'],
                    ['📦', 'Borrow Equipment', '장비 대여 요청'],
                    ['📅', 'Register Event',   '이번 달 이벤트'],
                    ['?',  'Ask Question',     'Q&A에 질문하기'],
                  ].map(([ic, t, s]) => (
                    <button key={t} style={{
                      padding: 16, borderRadius: 8, border: '1px solid var(--hairline)',
                      background: 'var(--paper)', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', gap: 6
                    }}>
                      <span style={{ fontSize: 18 }}>{ic}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{t}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Two-col grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Upcoming events */}
              <Card>
                <CardHeader title="이번 주 일정" action={<a style={{ fontSize: 12, color: 'var(--ink-500)' }}>전체보기 →</a>} />
                <div>
                  {events.map(([d, t, title, type], i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '54px 60px 1fr 70px',
                      padding: '14px 20px', alignItems: 'center', gap: 12,
                      borderBottom: i < events.length - 1 ? '1px solid var(--hairline-2)' : 0
                    }}>
                      <span className="display" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>{d}</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{t}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{title}</span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 4,
                        background: 'var(--paper-3)', color: 'var(--ink-700)',
                        textAlign: 'center', width: 'fit-content', justifySelf: 'end'
                      }}>{type}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Todos */}
              <Card>
                <CardHeader title="오늘 할 일" action={<a style={{ fontSize: 12, color: 'var(--ink-500)' }}>+ 추가</a>} />
                <div>
                  {todos.map(([t, d, p], i) => (
                    <label key={i} style={{
                      display: 'grid', gridTemplateColumns: '20px 1fr 60px 50px',
                      padding: '14px 20px', alignItems: 'center', gap: 12,
                      borderBottom: i < todos.length - 1 ? '1px solid var(--hairline-2)' : 0,
                      cursor: 'pointer'
                    }}>
                      <input type="checkbox" style={{ width: 14, height: 14 }} />
                      <span style={{ fontSize: 13.5 }}>{t}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>마감 {d}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: priorityColor[p] + '22', color: priorityColor[p],
                        textAlign: 'center', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.04em'
                      }}>{p}</span>
                    </label>
                  ))}
                </div>
              </Card>

              {/* Notices */}
              <Card>
                <CardHeader title="최근 공지" action={<a style={{ fontSize: 12, color: 'var(--ink-500)' }}>전체보기 →</a>} />
                <div>
                  {notices.map(([c, t, d], i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '60px 1fr 50px',
                      padding: '14px 20px', alignItems: 'center', gap: 12,
                      borderBottom: i < notices.length - 1 ? '1px solid var(--hairline-2)' : 0
                    }}>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 4,
                        background: 'var(--navy-50)', color: 'var(--navy-800)',
                        textAlign: 'center', width: 'fit-content', fontWeight: 500
                      }}>{c}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{d}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Resources */}
              <Card>
                <CardHeader title="최근 자료" action={<a style={{ fontSize: 12, color: 'var(--ink-500)' }}>전체보기 →</a>} />
                <div>
                  {resources.map(([type, t, d], i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '50px 1fr 50px',
                      padding: '14px 20px', alignItems: 'center', gap: 12,
                      borderBottom: i < resources.length - 1 ? '1px solid var(--hairline-2)' : 0
                    }}>
                      <span className="mono" style={{
                        fontSize: 10, padding: '3px 6px',
                        background: 'var(--ink-900)', color: 'var(--paper)',
                        textAlign: 'center', borderRadius: 3, fontWeight: 600
                      }}>{type}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{d}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* My projects */}
            <Card>
              <CardHeader title="내 프로젝트" action={<a style={{ fontSize: 12, color: 'var(--ink-500)' }}>전체보기 →</a>} />
              <div>
                <div style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 100px 1.4fr 90px',
                  padding: '10px 20px', background: 'var(--paper-2)',
                  borderBottom: '1px solid var(--hairline-2)',
                  fontSize: 11, color: 'var(--ink-500)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, gap: 16
                }}>
                  <span>프로젝트명</span><span>역할</span><span>상태</span><span>진행률</span><span></span>
                </div>
                {projects.map(([n, role, status, prog], i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 100px 1.4fr 90px',
                    padding: '16px 20px', alignItems: 'center', gap: 16,
                    borderBottom: i < projects.length - 1 ? '1px solid var(--hairline-2)' : 0
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{n}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-700)' }}>{role}</span>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 4,
                      background: 'var(--navy-800)', color: 'var(--paper)',
                      width: 'fit-content', fontWeight: 500
                    }}>● {status}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--paper-3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: prog + '%', background: 'var(--navy-800)' }} />
                      </div>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--ink-700)', minWidth: 32 }}>{prog}%</span>
                    </div>
                    <button style={{
                      padding: '6px 10px', fontSize: 12, fontWeight: 500,
                      background: 'transparent', border: '1px solid var(--hairline)', borderRadius: 6, cursor: 'pointer'
                    }}>보기 →</button>
                  </div>
                ))}
              </div>
            </Card>
          </main>
        </div>
      </div>
    );
  };

  // ── Activity log page (활동 기록) ────────────
  const ActivityLog = () => {
    const logs = [
      { d: '2026.02.17', t: '14:32', cat: 'study',   title: 'ROS Navigation 2 — Costmap 튜닝',                                hours: 2.5, tags: ['ROS', 'Nav2'] },
      { d: '2026.02.16', t: '20:18', cat: 'project', title: '자율주행 로봇 — SLAM 파라미터 조정 후 5m 이상 안정 주행 확인',  hours: 3.0, tags: ['SLAM'] },
      { d: '2026.02.15', t: '19:00', cat: 'event',   title: 'ROS 2 워크샵 참석',                                              hours: 2.0, tags: ['워크샵'] },
      { d: '2026.02.14', t: '15:40', cat: 'study',   title: 'PyTorch 객체 인식 모델 학습 — fine-tuning',                      hours: 4.0, tags: ['PyTorch', 'YOLO'] },
      { d: '2026.02.13', t: '21:05', cat: 'qna',     title: 'Q&A 답변 — "Costmap이 너무 보수적으로 잡힌다" 질문에 답변',      hours: 0.5, tags: [] },
      { d: '2026.02.12', t: '18:30', cat: 'project', title: '딥러닝 물체 인식 — 데이터셋 라벨링 작업',                        hours: 2.0, tags: ['Dataset'] },
    ];
    const catColor = {
      study:   ['#22c55e22', '#15803d', 'STUDY'],
      project: ['#103078' + '22', 'var(--navy-800)', 'PROJECT'],
      event:   ['#f9731622', '#c2410c', 'EVENT'],
      qna:     ['#a855f722', '#7e22ce', 'Q&A'],
    };
    return (
      <div className="kb-root" style={{ display: 'flex', minHeight: '100%', background: 'var(--paper-2)' }}>
        <Sidebar active="" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar />
          <main style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                  member / study-log
                </div>
                <h1 className="display" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
                  Study Log
                </h1>
                <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: '6px 0 0' }}>
                  이번 학기 누적 <strong style={{ color: 'var(--ink-900)' }}>47.5시간</strong> · 활동 23건
                </p>
              </div>
              <button style={{
                padding: '10px 16px', border: 0, background: 'var(--navy-800)', color: 'var(--paper)',
                borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer'
              }}>+ 새 활동 기록</button>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                ['이번 주', '12.0h', '+2.5h vs 지난 주'],
                ['이번 달', '47.5h', '목표 60h 중 79%'],
                ['최다 카테고리', 'STUDY', '전체의 42%'],
                ['연속 기록일', '8일', '최장 12일'],
              ].map(([t, v, s]) => (
                <Card key={t} style={{ padding: 20 }}>
                  <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: 0 }}>{t}</p>
                  <p className="display" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: '4px 0' }}>{v}</p>
                  <p style={{ fontSize: 11, color: 'var(--ink-500)', margin: 0 }}>{s}</p>
                </Card>
              ))}
            </div>

            {/* Filter row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input placeholder="활동 검색…" style={{
                padding: '8px 12px', border: '1px solid var(--hairline)', borderRadius: 8,
                fontSize: 13, width: 280, outline: 'none', fontFamily: 'inherit', background: 'var(--paper)'
              }}/>
              <span style={{ fontSize: 12, color: 'var(--ink-500)', marginLeft: 8 }}>카테고리:</span>
              {['전체', 'study', 'project', 'event', 'qna'].map((t, i) => (
                <button key={t} style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 12,
                  background: i === 0 ? 'var(--ink-900)' : 'var(--paper)',
                  color: i === 0 ? 'var(--paper)' : 'var(--ink-700)',
                  border: '1px solid ' + (i === 0 ? 'var(--ink-900)' : 'var(--hairline)'),
                  cursor: 'pointer', fontWeight: i === 0 ? 600 : 400, fontFamily: 'var(--font-mono)'
                }}>{t}</button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-500)' }}>
                Group by: <strong style={{ color: 'var(--ink-900)' }}>날짜</strong>
              </span>
            </div>

            {/* Log list */}
            <Card>
              {logs.map((l, i) => {
                const [bg, fg, label] = catColor[l.cat];
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '110px 80px 1fr 100px 80px',
                    padding: '18px 24px', alignItems: 'center', gap: 16,
                    borderBottom: i < logs.length - 1 ? '1px solid var(--hairline-2)' : 0,
                    cursor: 'pointer'
                  }}>
                    <div>
                      <div className="mono" style={{ fontSize: 13, color: 'var(--ink-900)' }}>{l.d}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{l.t}</div>
                    </div>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 4,
                      background: bg, color: fg,
                      textAlign: 'center', width: 'fit-content', fontWeight: 600,
                      letterSpacing: '0.04em'
                    }}>{label}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{l.title}</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {l.tags.map(t => (
                          <span key={t} style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 3,
                            background: 'var(--paper-3)', color: 'var(--ink-700)',
                            fontFamily: 'var(--font-mono)'
                          }}>#{t}</span>
                        ))}
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 13, color: 'var(--ink-700)', textAlign: 'right' }}>{l.hours}h</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'right' }}>편집 ↗</span>
                  </div>
                );
              })}
            </Card>
          </main>
        </div>
      </div>
    );
  };

  // ── Project management page (프로젝트 관리) ──
  const ProjectManage = () => {
    const tasks = [
      { id: 'T-12', t: 'SLAM 파라미터 튜닝',           assignee: 'JD', status: 'doing',  due: '2/20', tags: ['urgent'] },
      { id: 'T-11', t: 'ROS bag 데이터 수집',          assignee: 'SK', status: 'doing',  due: '2/22', tags: [] },
      { id: 'T-10', t: 'Costmap 시각화 디버그 도구',   assignee: 'YJ', status: 'review', due: '2/19', tags: [] },
      { id: 'T-09', t: '센서 융합 알고리즘 — 1차안',   assignee: 'JD', status: 'done',   due: '2/14', tags: [] },
      { id: 'T-08', t: '하드웨어 배선 정리',           assignee: 'MH', status: 'todo',   due: '2/25', tags: ['low'] },
      { id: 'T-07', t: '발표 자료 초안',                assignee: 'SK', status: 'todo',   due: '3/01', tags: [] },
    ];
    const statusMap = {
      todo:   ['var(--paper-3)',  'var(--ink-700)',  'TO DO'],
      doing:  ['var(--navy-50)',  'var(--navy-800)', 'DOING'],
      review: ['#fef3c7',         '#a16207',         'REVIEW'],
      done:   ['#dcfce7',         '#15803d',         'DONE'],
    };
    return (
      <div className="kb-root" style={{ display: 'flex', minHeight: '100%', background: 'var(--paper-2)' }}>
        <Sidebar active="projects" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar />
          <main style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                member / projects / <span style={{ color: 'var(--ink-900)' }}>auto-driving-robot</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <h1 className="display" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
                    자율주행 로봇 개발
                  </h1>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: 'var(--ink-500)' }}>
                    <span>● 진행중</span>
                    <span>·</span>
                    <span>리드: John Doe</span>
                    <span>·</span>
                    <span>팀원 5명</span>
                    <span>·</span>
                    <span>2025.09 →</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    padding: '9px 14px', border: '1px solid var(--hairline)',
                    background: 'var(--paper)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer'
                  }}>설정</button>
                  <button style={{
                    padding: '9px 14px', border: 0, background: 'var(--navy-800)', color: 'var(--paper)',
                    borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer'
                  }}>+ 태스크 추가</button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--hairline)' }}>
              {[
                ['Overview', false],
                ['Tasks', true],
                ['Files', false],
                ['Members', false],
                ['Activity', false],
                ['Settings', false],
              ].map(([t, sel]) => (
                <button key={t} style={{
                  padding: '10px 16px', background: 'transparent', border: 0,
                  borderBottom: '2px solid ' + (sel ? 'var(--navy-800)' : 'transparent'),
                  fontSize: 13, fontWeight: sel ? 600 : 400, cursor: 'pointer',
                  color: sel ? 'var(--ink-900)' : 'var(--ink-500)', marginBottom: -1
                }}>{t}</button>
              ))}
            </div>

            {/* Progress strip */}
            <Card style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--ink-500)', margin: 0 }}>Sprint 4 / 8 · 2/14 — 2/27</p>
                  <p className="display" style={{ fontSize: 24, fontWeight: 600, margin: '4px 0 0' }}>
                    진행률 <span style={{ color: 'var(--navy-800)' }}>65%</span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
                  {[
                    ['12', 'TO DO',   'var(--ink-700)'],
                    ['8',  'DOING',   'var(--navy-800)'],
                    ['3',  'REVIEW',  '#a16207'],
                    ['24', 'DONE',    '#15803d'],
                  ].map(([n, l, c]) => (
                    <div key={l} style={{ textAlign: 'center' }}>
                      <div className="display" style={{ fontSize: 22, fontWeight: 600, color: c }}>{n}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-500)', letterSpacing: '0.06em' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ height: 6, background: 'var(--paper-3)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '52%', background: '#15803d' }} />
                <div style={{ width: '6%',  background: '#a16207' }} />
                <div style={{ width: '17%', background: 'var(--navy-800)' }} />
              </div>
            </Card>

            {/* Task table */}
            <Card>
              <div style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 80px 90px 80px 60px',
                padding: '12px 20px', background: 'var(--paper-2)',
                borderBottom: '1px solid var(--hairline-2)',
                fontSize: 11, color: 'var(--ink-500)',
                textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, gap: 12
              }}>
                <span>ID</span><span>제목</span><span>담당</span><span>상태</span><span>마감</span><span></span>
              </div>
              {tasks.map((t, i) => {
                const [bg, fg, label] = statusMap[t.status];
                return (
                  <div key={t.id} style={{
                    display: 'grid', gridTemplateColumns: '60px 1fr 80px 90px 80px 60px',
                    padding: '14px 20px', alignItems: 'center', gap: 12,
                    borderBottom: i < tasks.length - 1 ? '1px solid var(--hairline-2)' : 0,
                    cursor: 'pointer'
                  }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{t.id}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t.t}</span>
                      {t.tags.includes('urgent') && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>URGENT</span>
                      )}
                    </div>
                    <span style={{
                      width: 26, height: 26, borderRadius: 13, background: 'var(--navy-800)',
                      color: 'var(--paper)', fontSize: 11, fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                    }}>{t.assignee}</span>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 4,
                      background: bg, color: fg, textAlign: 'center', width: 'fit-content', fontWeight: 600
                    }}>{label}</span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--ink-700)' }}>{t.due}</span>
                    <span style={{ fontSize: 14, color: 'var(--ink-400)', textAlign: 'right' }}>⋯</span>
                  </div>
                );
              })}
            </Card>
          </main>
        </div>
      </div>
    );
  };

  return { Dashboard, ActivityLog, ProjectManage };
})();
