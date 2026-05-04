/* === Variation 4: Quiet Notion ===
   얇은 보더, 일관된 리스트, 정보 우선, 노션·리니어 스타일 */

window.V4QuietNotion = (function() {
  const Header = () => (
    <header style={{
      borderBottom: '1px solid var(--hairline)',
      padding: '12px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--paper)', fontSize: 14
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <span style={{ width: 18, height: 18, background: 'var(--navy-800)', borderRadius: 4, display: 'inline-block' }} />
          kobot
        </span>
        <nav style={{ display: 'flex', gap: 4, color: 'var(--ink-700)' }}>
          {['활동', '프로젝트', '공지', '모집', 'FAQ'].map((t, i) => (
            <a key={t} style={{
              padding: '6px 12px', borderRadius: 6,
              background: i === 0 ? 'var(--paper-3)' : 'transparent',
              color: i === 0 ? 'var(--ink-900)' : 'var(--ink-700)',
              fontWeight: i === 0 ? 600 : 400
            }}>{t}</a>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ padding: '6px 10px', background: 'var(--paper-3)', borderRadius: 6, fontSize: 12, color: 'var(--ink-500)' }}>⌘K 검색</span>
        <button style={{
          padding: '8px 14px', background: 'var(--navy-800)', color: 'var(--paper)',
          border: 0, borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer'
        }}>로그인</button>
      </div>
    </header>
  );

  const Landing = () => (
    <div className="kb-root" style={{ background: 'var(--paper)' }}>
      <Header />
      <section style={{ padding: '80px 32px 64px', maxWidth: 920, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 10px', background: 'var(--navy-50)', borderRadius: 999,
          fontSize: 12, color: 'var(--navy-800)', marginBottom: 24, fontWeight: 500
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--navy-800)' }} />
          2026 봄학기 부원 모집 · D-5
        </div>

        <h1 className="display" style={{
          fontSize: 64, fontWeight: 600, letterSpacing: '-0.035em',
          lineHeight: 1.05, margin: 0, color: 'var(--ink-900)'
        }}>
          국민대 로봇 학술동아리,<br/>
          <span style={{ color: 'var(--ink-400)' }}>kobot.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--ink-500)', marginTop: 24, maxWidth: 640 }}>
          ROS, 임베디드, 비전, 웹 통합. 매학기 한 번의 데모데이까지, 함께 만드는 로봇.
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 32 }}>
          <button style={{
            padding: '10px 18px', background: 'var(--ink-900)', color: 'var(--paper)',
            border: 0, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer'
          }}>지원하기 →</button>
          <button style={{
            padding: '10px 18px', background: 'var(--paper)', color: 'var(--ink-900)',
            border: '1px solid var(--hairline)', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer'
          }}>활동 보기</button>
        </div>
      </section>

      {/* Sections list */}
      <section style={{ padding: '0 32px 96px', maxWidth: 920, margin: '0 auto' }}>
        <div style={{
          fontSize: 11, color: 'var(--ink-500)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 16, fontWeight: 600
        }}>이번 학기</div>

        <div style={{ border: '1px solid var(--hairline)', borderRadius: 10, overflow: 'hidden', marginBottom: 32 }}>
          {[
            ['📅', '다음 일정', '프로젝트 스프린트', '2/18 09:00 · 310호', 'D-3'],
            ['👥', '신입 환영회', '2026 봄학기 신입 부원', '2/22 18:00 · 공학관 310호', 'D-7'],
            ['⚡', '해커톤 위크', '4일간 집중 개발', '2/25 ~ 2/28', 'D-10'],
            ['🎯', '데모데이', '학기말 최종 발표', '3/05 09:00 · 대강당', 'D-18'],
          ].map(([icon, k, t, sub, d], i, arr) => (
            <div key={k} style={{
              display: 'grid', gridTemplateColumns: '32px 200px 1fr auto',
              gap: 16, padding: '16px 20px', alignItems: 'center',
              borderBottom: i < arr.length - 1 ? '1px solid var(--hairline)' : 0
            }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{k}</span>
              <div>
                <div style={{ fontSize: 14, color: 'var(--ink-900)' }}>{t}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{sub}</div>
              </div>
              <span style={{
                padding: '3px 8px', borderRadius: 4,
                background: 'var(--navy-50)', color: 'var(--navy-800)',
                fontSize: 11, fontWeight: 600
              }}>{d}</span>
            </div>
          ))}
        </div>

        <div style={{
          fontSize: 11, color: 'var(--ink-500)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 16, fontWeight: 600
        }}>스터디 트랙</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            ['ROS·로보틱스', 'Nav2, MoveIt, Gazebo', 12],
            ['임베디드·IoT', 'STM32, Arduino, RTOS', 8],
            ['컴퓨터 비전', 'OpenCV, YOLO, PyTorch', 10],
            ['웹·통합', 'React, FastAPI, ROS Bridge', 7],
          ].map(([t, s, c]) => (
            <div key={t} style={{
              border: '1px solid var(--hairline)', borderRadius: 10,
              padding: 20, cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{t}</h3>
                <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>{c}명</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: '6px 0 0' }}>{s}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const Activities = () => {
    const items = [
      ['2026.02.15', 'ROS', '워크샵', 'ROS2 워크샵 — 자율주행 시뮬레이션', '#22c55e'],
      ['2026.02.08', '임베디드', '스터디', 'ARM Cortex-M 임베디드 시스템', '#0ea5e9'],
      ['2026.02.01', '대회',   '수상',   '2026 Winter Hackathon — 우수상', '#eab308'],
      ['2026.01.25', '임베디드', '세미나', 'Arduino 입문 세미나', '#0ea5e9'],
      ['2026.01.18', 'ROS',   '프로젝트', '6축 로봇팔 제어 + MoveIt', '#22c55e'],
      ['2026.01.12', '스터디', '코딩', 'Python 알고리즘 풀이', '#a855f7'],
      ['2025.12.20', '행사',   '견학',   '로보틱스 랩 투어', '#f97316'],
    ];
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ padding: '48px 32px', maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <h1 className="display" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
              활동
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 6 }}>총 47건의 활동 기록</p>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <input placeholder="활동 검색…" style={{
              padding: '8px 12px', border: '1px solid var(--hairline)', borderRadius: 8,
              fontSize: 13, width: 240, fontFamily: 'inherit', outline: 'none'
            }}/>
            <span style={{ fontSize: 12, color: 'var(--ink-500)', marginLeft: 8 }}>필터:</span>
            {['전체', 'ROS', '임베디드', '비전', '대회', '세미나'].map((t, i) => (
              <button key={t} style={{
                padding: '5px 11px', borderRadius: 6, fontSize: 12,
                background: i === 0 ? 'var(--paper-3)' : 'transparent',
                color: i === 0 ? 'var(--ink-900)' : 'var(--ink-500)',
                border: '1px solid ' + (i === 0 ? 'var(--hairline)' : 'transparent'),
                fontWeight: i === 0 ? 600 : 400, cursor: 'pointer'
              }}>{t}</button>
            ))}
          </div>

          <div style={{ border: '1px solid var(--hairline)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '110px 100px 90px 1fr 100px',
              padding: '10px 16px', background: 'var(--paper-2)',
              borderBottom: '1px solid var(--hairline)',
              fontSize: 11, color: 'var(--ink-500)',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600
            }}>
              <span>날짜</span><span>분류</span><span>형식</span><span>제목</span><span style={{ textAlign: 'right' }}></span>
            </div>
            {items.map(([d, c, k, t, color], i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '110px 100px 90px 1fr 100px',
                padding: '14px 16px', alignItems: 'center', gap: 12,
                borderBottom: i < items.length - 1 ? '1px solid var(--hairline-2)' : 0,
                cursor: 'pointer'
              }}>
                <span style={{ fontSize: 13, color: 'var(--ink-500)', fontFamily: 'var(--font-mono)' }}>{d}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  {c}
                </span>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 4,
                  background: 'var(--paper-3)', color: 'var(--ink-700)',
                  width: 'fit-content', fontWeight: 500
                }}>{k}</span>
                <span style={{ fontSize: 14, color: 'var(--ink-900)', fontWeight: 500 }}>{t}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'right' }}>열기 ↗</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const Projects = () => {
    const projects = [
      { t: '자율주행 로봇', desc: 'SLAM 기반 실내 네비게이션', tags: ['ROS', 'Python', 'SLAM'], status: '진행중', team: 5, prog: 65 },
      { t: '6축 로봇팔 제어', desc: '역기구학 정밀 제어', tags: ['C++', 'ROS'], status: '완료', team: 4, prog: 100 },
      { t: '드론 자동 착륙', desc: 'ArUco 마커 비전 착륙', tags: ['OpenCV', 'PX4'], status: '진행중', team: 3, prog: 40 },
      { t: '딥러닝 물체 인식', desc: 'YOLO + ROS 통합', tags: ['TF', 'YOLO'], status: '진행중', team: 6, prog: 80 },
      { t: '협동 로봇 시스템', desc: '다중 로봇 분산 제어', tags: ['ROS2', 'DDS'], status: '계획중', team: 5, prog: 0 },
      { t: '휴머노이드 보행', desc: 'ZMP 보행 패턴 생성', tags: ['MATLAB'], status: '완료', team: 4, prog: 100 },
    ];
    const dotColor = { '진행중': 'var(--navy-800)', '완료': '#9a9a98', '계획중': '#d1d1cf' };
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ padding: '48px 32px', maxWidth: 1080, margin: '0 auto' }}>
          <h1 className="display" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            프로젝트
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 6, marginBottom: 32 }}>
            진행중 8 · 완료 12 · 계획 3
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {projects.map((p, i) => (
              <article key={i} style={{
                border: '1px solid var(--hairline)', borderRadius: 10,
                padding: 20, cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{p.t}</h3>
                  <span style={{
                    fontSize: 11, color: 'var(--ink-700)',
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: dotColor[p.status] }} />
                    {p.status}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: '0 0 16px' }}>{p.desc}</p>

                {/* progress mini */}
                <div style={{ height: 4, background: 'var(--paper-3)', borderRadius: 2, marginBottom: 12 }}>
                  <div style={{
                    height: '100%', width: p.prog + '%',
                    background: dotColor[p.status], borderRadius: 2
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {p.tags.map(t => (
                      <span key={t} style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 4,
                        background: 'var(--paper-3)', color: 'var(--ink-700)'
                      }}>{t}</span>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{p.team}명 · {p.prog}%</span>
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
      { p: true, c: '모집', t: '2026년 상반기 신입 부원 모집 공고', d: '2026.02.15', preview: '4개 트랙 중 선택 지원. 비전공자 환영합니다.', dot: '#ef4444' },
      { p: true, c: '세미나', t: 'ROS 2 Navigation Stack 고급 세미나', d: '2026.02.14', preview: 'Nav2, AMCL, costmap 심화 세션 진행.', dot: '#a855f7' },
      { p: false, c: '행사', t: '국제 로봇 경진대회 참가 안내', d: '2026.02.13', preview: '3월 개최 · 출전팀을 모집합니다.', dot: '#f97316' },
      { p: false, c: '일반', t: '정기 총회 개최 안내', d: '2026.02.12', preview: '2/20 19:00, 전 부원 필수 참석.', dot: '#9a9a98' },
      { p: false, c: '행사', t: '프로젝트 중간 발표회', d: '2026.02.10', preview: '진행중 프로젝트 8건 발표.', dot: '#f97316' },
      { p: false, c: '일반', t: '동아리방 이용 규칙 안내', d: '2026.02.08', preview: '운영 규정 v3 업데이트.', dot: '#9a9a98' },
    ];
    return (
      <div className="kb-root" style={{ background: 'var(--paper)' }}>
        <Header />
        <section style={{ padding: '48px 32px', maxWidth: 880, margin: '0 auto' }}>
          <h1 className="display" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            공지사항
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 6, marginBottom: 32 }}>
            동아리의 모든 공식 발표
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <input placeholder="공지사항 검색…" style={{
              padding: '8px 12px', border: '1px solid var(--hairline)', borderRadius: 8,
              fontSize: 13, flex: 1, outline: 'none', fontFamily: 'inherit'
            }}/>
            {['전체', '모집', '세미나', '행사', '일반'].map((t, i) => (
              <button key={t} style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 12,
                background: i === 0 ? 'var(--paper-3)' : 'transparent',
                border: '1px solid ' + (i === 0 ? 'var(--hairline)' : 'transparent'),
                color: i === 0 ? 'var(--ink-900)' : 'var(--ink-500)',
                fontWeight: i === 0 ? 600 : 400, cursor: 'pointer'
              }}>{t}</button>
            ))}
          </div>

          <div style={{ border: '1px solid var(--hairline)', borderRadius: 10, overflow: 'hidden' }}>
            {notices.map((n, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '20px 80px 1fr 100px',
                padding: '16px 20px', alignItems: 'baseline', gap: 16,
                borderBottom: i < notices.length - 1 ? '1px solid var(--hairline)' : 0,
                background: n.p ? 'var(--paper-2)' : 'var(--paper)',
                cursor: 'pointer'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: n.dot, marginTop: 8 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-700)', fontWeight: 500 }}>
                  {n.p && <span style={{ marginRight: 4, color: 'var(--navy-800)' }}>📌</span>}
                  {n.c}
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--ink-900)' }}>{n.t}</h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: '4px 0 0' }}>{n.preview}</p>
                </div>
                <span style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{n.d}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  return { Landing, Activities, Projects, Notice };
})();
