/* === Variation 3: Bold Block ===
   Navy 풀블리드 섹션, 강한 hierarchy, 컬러 블록, 두꺼운 헤딩 */

window.V3BoldBlock = (function() {
  const Header = ({ dark }) => (
    <header style={{
      padding: '18px 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: dark ? 'var(--navy-900)' : 'var(--paper)',
      color: dark ? 'var(--paper)' : 'var(--ink-900)',
      borderBottom: dark ? 'none' : '1px solid var(--hairline)'
    }}>
      <span className="display" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em' }}>
        kobot
      </span>
      <nav style={{ display: 'flex', gap: 28, fontSize: 14, fontWeight: 500 }}>
        <a>활동</a><a>프로젝트</a><a>공지</a><a>모집</a>
      </nav>
      <button style={{
        padding: '10px 18px', background: dark ? 'var(--paper)' : 'var(--navy-800)',
        color: dark ? 'var(--navy-900)' : 'var(--paper)', border: 0, fontSize: 13, fontWeight: 600, cursor: 'pointer'
      }}>지원하기 →</button>
    </header>
  );

  const Landing = () => (
    <div className="kb-root" style={{ minHeight: '100%' }}>
      <Header dark />
      <section style={{ background: 'var(--navy-900)', color: 'var(--paper)', padding: '0 0 0', overflow: 'hidden', position: 'relative' }}>
        <div style={{ padding: '80px 48px 96px', maxWidth: 1440, margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: 999,
            fontSize: 12, marginBottom: 32
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#7ab8ff' }} />
            <span>2026 봄학기 모집중 · D-5</span>
          </div>

          <h1 className="display" style={{
            fontSize: 168, lineHeight: 0.88, fontWeight: 800,
            letterSpacing: '-0.05em', margin: 0
          }}>
            로봇을<br/>
            <span style={{ color: '#7ab8ff' }}>만든다.</span>
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, marginTop: 56, alignItems: 'start' }}>
            <p style={{ fontSize: 22, lineHeight: 1.5, color: 'rgba(255,255,255,0.78)', maxWidth: 640, margin: 0 }}>
              국민대 소프트웨어융합대학 로봇 학술동아리. ROS · 임베디드 · 비전 · 웹. 매학기 한 번의 데모데이까지.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button style={{
                padding: '20px 28px', background: 'var(--paper)', color: 'var(--navy-900)',
                border: 0, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span>지금 지원하기</span><span>→</span>
              </button>
              <button style={{
                padding: '20px 28px', background: 'transparent', color: 'var(--paper)',
                border: '1px solid rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 600, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between'
              }}>
                <span>활동 둘러보기</span><span>↗</span>
              </button>
            </div>
          </div>
        </div>

        {/* big number row */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          margin: '0 48px'
        }}>
          {[
            ['47',   'Active', '재학·졸업'],
            ['23',   'Shipped', '프로젝트'],
            ['12',   'Awards', '대회 수상'],
            ['2018', 'Since', '8년차 동아리'],
          ].map(([v, k, s], i) => (
            <div key={k} style={{
              padding: '40px 32px',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.12)' : 0
            }}>
              <div className="display" style={{ fontSize: 88, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 14, color: '#7ab8ff', marginTop: 12, fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Track block on white */}
      <section style={{ background: 'var(--paper)', padding: '96px 48px' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 40 }}>
            <h2 className="display" style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em', margin: 0 }}>
              네 개의 트랙.
            </h2>
            <span style={{ fontSize: 14, color: 'var(--ink-500)' }}>4 tracks · select one when you join</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {[
              ['01', 'ROS·로보틱스', 'Navigation, MoveIt, Gazebo', 12, 'var(--navy-900)'],
              ['02', '임베디드·IoT', 'STM32, Arduino, RTOS', 8, 'var(--navy-700)'],
              ['03', '컴퓨터 비전', 'OpenCV, YOLO, PyTorch', 10, 'var(--navy-600)'],
              ['04', '웹·통합', 'React, FastAPI, ROS Bridge', 7, 'var(--navy-500)'],
            ].map(([n, t, s, c, bg]) => (
              <div key={n} style={{
                background: bg, color: 'var(--paper)', padding: '40px 32px',
                minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                cursor: 'pointer'
              }}>
                <div style={{ fontSize: 14, opacity: 0.6, fontWeight: 600 }}>{n}</div>
                <div>
                  <h3 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{t}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '8px 0 24px' }}>{s}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 16 }}>
                    <span style={{ fontSize: 13 }}>{c} 명 참여중</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const Activities = () => {
    const items = [
      { d: '2026.02.15', tag: 'WORKSHOP',  t: 'ROS2 워크샵', sub: '자율주행 시뮬레이션', big: true,  color: 'var(--navy-900)' },
      { d: '2026.02.08', tag: 'STUDY',     t: 'ARM Cortex-M', sub: '임베디드 시스템 스터디' },
      { d: '2026.02.01', tag: 'AWARD',     t: 'Winter Hackathon', sub: '2026 우수상 수상', big: true, color: 'var(--navy-700)' },
      { d: '2026.01.25', tag: 'SEMINAR',   t: 'Arduino 입문', sub: '신입 부원 대상 세미나' },
      { d: '2026.01.18', tag: 'PROJECT',   t: '6축 로봇팔', sub: '역기구학 + MoveIt 연동' },
      { d: '2026.01.12', tag: 'STUDY',     t: 'Python 알고리즘', sub: '백준 골드 풀이 세션' },
    ];
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ background: 'var(--navy-900)', color: 'var(--paper)', padding: '64px 48px' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>활동 / Activities</div>
            <h1 className="display" style={{ fontSize: 120, fontWeight: 800, letterSpacing: '-0.05em', margin: 0, lineHeight: 0.9 }}>
              우리가<br/>해온 일들.
            </h1>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              {['전체 47', 'ROS 12', '임베디드 8', '비전 10', '웹·통합 7', '대회 5', '세미나 9'].map((t, i) => (
                <span key={t} style={{
                  padding: '10px 16px', fontSize: 13, fontWeight: 500,
                  background: i === 0 ? 'var(--paper)' : 'transparent',
                  color: i === 0 ? 'var(--navy-900)' : 'var(--paper)',
                  border: '1px solid ' + (i === 0 ? 'var(--paper)' : 'rgba(255,255,255,0.25)')
                }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '64px 48px', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
            {items.map((it, i) => (
              <article key={i} style={{
                gridColumn: it.big ? 'span 4' : 'span 2',
                gridRow: it.big ? 'span 1' : 'span 1',
                background: it.big ? it.color : 'var(--paper-3)',
                color: it.big ? 'var(--paper)' : 'var(--ink-900)',
                padding: it.big ? '48px' : '32px',
                minHeight: 320,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                cursor: 'pointer', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{
                    padding: '4px 10px',
                    background: it.big ? 'rgba(255,255,255,0.15)' : 'var(--paper)',
                    color: it.big ? 'var(--paper)' : 'var(--navy-800)',
                    fontWeight: 600, letterSpacing: '0.06em'
                  }}>{it.tag}</span>
                  <span style={{ opacity: 0.7 }}>{it.d}</span>
                </div>
                <div>
                  <h3 className="display" style={{
                    fontSize: it.big ? 48 : 24, fontWeight: 700,
                    letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05
                  }}>{it.t}</h3>
                  <p style={{
                    fontSize: it.big ? 16 : 14, opacity: 0.75,
                    margin: '8px 0 0'
                  }}>{it.sub}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const Projects = () => {
    const projects = [
      { id: '01', t: '자율주행 로봇', desc: 'SLAM 기반 실내 네비게이션. LiDAR + 카메라 통합으로 정밀한 위치 추정과 장애물 회피.', tags: ['ROS', 'Python', 'SLAM'], status: '진행중', team: 5, period: '2025.09 →' },
      { id: '02', t: '6축 로봇팔', desc: '역기구학 기반 6축 로봇팔 정밀 제어. 궤적 계획과 PID 제어로 안정적 동작.', tags: ['C++', 'ROS', 'Kinematics'], status: '완료', team: 4, period: '25.03 — 25.08' },
      { id: '03', t: '드론 자동 착륙', desc: 'ArUco 마커 인식과 PX4 제어를 통한 자동 착륙 시스템.', tags: ['OpenCV', 'PX4'], status: '진행중', team: 3, period: '2025.11 →' },
      { id: '04', t: '딥러닝 물체 인식', desc: 'YOLO 모델 실시간 물체 인식, ROS 통합 응용 시스템.', tags: ['TensorFlow', 'YOLO', 'ROS'], status: '진행중', team: 6, period: '2025.09 →' },
    ];
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ padding: '80px 48px', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 13, color: 'var(--navy-800)', marginBottom: 12, fontWeight: 600 }}>프로젝트 / 23 shipped</div>
            <h1 className="display" style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-0.05em', margin: 0, lineHeight: 0.95 }}>
              만든 것들.
            </h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
            {projects.map((p, i) => (
              <article key={p.id} style={{
                background: i % 3 === 0 ? 'var(--navy-900)' : 'var(--paper-3)',
                color: i % 3 === 0 ? 'var(--paper)' : 'var(--ink-900)',
                padding: 48, minHeight: 360,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="display" style={{ fontSize: 56, fontWeight: 800, opacity: 0.4, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {p.id}
                  </span>
                  <span style={{
                    padding: '6px 12px', fontSize: 11, fontWeight: 600,
                    background: p.status === '진행중' ? '#7ab8ff' : 'transparent',
                    color: p.status === '진행중' ? 'var(--navy-900)' : (i % 3 === 0 ? 'var(--paper)' : 'var(--ink-700)'),
                    border: p.status === '진행중' ? 0 : ('1px solid ' + (i % 3 === 0 ? 'rgba(255,255,255,0.3)' : 'var(--ink-300)')),
                    height: 'fit-content'
                  }}>● {p.status}</span>
                </div>
                <div>
                  <h3 className="display" style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>{p.t}</h3>
                  <p style={{ fontSize: 15, opacity: 0.75, margin: '12px 0 24px', maxWidth: 480, lineHeight: 1.55 }}>{p.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid ' + (i % 3 === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'), paddingTop: 20 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {p.tags.map(t => (
                        <span key={t} style={{
                          fontSize: 11, padding: '4px 10px',
                          background: i % 3 === 0 ? 'rgba(255,255,255,0.1)' : 'var(--paper)',
                          fontWeight: 500
                        }}>{t}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{p.team}명 · {p.period}</span>
                  </div>
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
      { p: true, c: '모집', t: '2026년 상반기 신입 부원 모집 공고', d: '2026.02.15', preview: '4개 트랙 중 선택 지원. 비전공자 환영.' },
      { p: true, c: '세미나', t: 'ROS 2 Navigation Stack 고급 세미나', d: '2026.02.14', preview: 'Nav2, AMCL, costmap 심화 세션.' },
      { p: false, c: '행사', t: '국제 로봇 경진대회 참가 안내', d: '2026.02.13', preview: '3월 개최 · 출전팀 모집.' },
      { p: false, c: '일반', t: '정기 총회 개최 안내', d: '2026.02.12', preview: '2/20 19:00, 전 부원 참석.' },
      { p: false, c: '행사', t: '프로젝트 중간 발표회', d: '2026.02.10', preview: '진행중 프로젝트 8건 발표.' },
    ];
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ background: 'var(--navy-900)', color: 'var(--paper)', padding: '64px 48px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h1 className="display" style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-0.05em', margin: 0, lineHeight: 1 }}>
              공지.
            </h1>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>2026 / 02 · 8 entries</span>
          </div>
        </section>

        <section style={{ padding: '48px', maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {['전체', '모집', '세미나', '행사', '일반'].map((t, i) => (
              <button key={t} style={{
                padding: '10px 18px',
                background: i === 0 ? 'var(--navy-900)' : 'var(--paper)',
                color: i === 0 ? 'var(--paper)' : 'var(--ink-700)',
                border: '1px solid ' + (i === 0 ? 'var(--navy-900)' : 'var(--hairline)'),
                fontSize: 13, fontWeight: 500, cursor: 'pointer'
              }}>{t}</button>
            ))}
          </div>

          {notices.map((n, i) => (
            <div key={i} style={{
              background: n.p ? 'var(--navy-50)' : 'var(--paper)',
              borderLeft: n.p ? '4px solid var(--navy-800)' : '4px solid transparent',
              padding: '24px 28px',
              marginBottom: 4,
              display: 'grid', gridTemplateColumns: '80px 1fr 100px',
              gap: 24, alignItems: 'center', cursor: 'pointer'
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px',
                background: n.p ? 'var(--navy-800)' : 'var(--paper-3)',
                color: n.p ? 'var(--paper)' : 'var(--ink-700)',
                width: 'fit-content', letterSpacing: '0.04em'
              }}>{n.p ? '★ ' : ''}{n.c}</span>
              <div>
                <h3 className="display" style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{n.t}</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: '6px 0 0' }}>{n.preview}</p>
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'right' }}>{n.d}</span>
            </div>
          ))}
        </section>
      </div>
    );
  };

  return { Landing, Activities, Projects, Notice };
})();
