export interface KookminCollegeOption {
  label: string;
  aliases: string[];
  departments: string[];
}

export interface KookminProfileNameParts {
  fullName: string | null;
  rawAffiliation: string | null;
  department: string | null;
  college: string | null;
}

export const KOOKMIN_COLLEGES: KookminCollegeOption[] = [
  {
    label: "글로벌인문·지역대학",
    aliases: ["글인대", "인문대", "글로벌인문지역대학"],
    departments: [
      "한국어문학부",
      "글로벌한국어전공",
      "영어영문학부",
      "영미어문전공",
      "중국학부",
      "중국어문전공",
      "한국역사학과",
    ],
  },
  {
    label: "사회과학대학",
    aliases: ["사과대", "사회대"],
    departments: [
      "행정학과",
      "정치외교학과",
      "사회학과",
      "미디어·광고학부",
      "미디어전공",
      "광고홍보학전공",
      "교육학과",
    ],
  },
  {
    label: "법과대학",
    aliases: ["법대"],
    departments: ["법학부", "법학전공"],
  },
  {
    label: "경상대학",
    aliases: ["경상대"],
    departments: ["경제학과", "국제통상학과"],
  },
  {
    label: "경영대학",
    aliases: ["경영대"],
    departments: ["경영학부", "경영학전공", "경영정보학부", "AI빅데이터융합경영학과"],
  },
  {
    label: "창의공과대학",
    aliases: ["공대", "창공대", "공과대학"],
    departments: [
      "신소재공학부",
      "기계공학부",
      "건설시스템공학부",
      "전자공학부",
      "지능전자공학전공",
      "전자시스템공학전공",
    ],
  },
  {
    label: "자동차융합대학",
    aliases: ["자융대", "자동차대"],
    departments: ["자동차공학과", "자동차IT융합학과", "미래자동차학부"],
  },
  {
    label: "소프트웨어융합대학",
    aliases: ["소융대", "소프트웨어대학", "소프트웨어융합대", "SW융합대학"],
    departments: ["소프트웨어학부", "소프트웨어전공", "인공지능학부", "인공지능전공"],
  },
  {
    label: "과학기술대학",
    aliases: ["과기대", "과학기술대"],
    departments: [
      "산림환경시스템학과",
      "임산생명공학과",
      "나노전자물리학과",
      "응용화학부",
      "나노소재전공",
      "바이오의약전공",
      "식품영양학과",
      "정보보안암호수학과",
      "바이오발효융합학과",
      "융합바이오공학과",
    ],
  },
  {
    label: "건축대학",
    aliases: ["건축대"],
    departments: ["건축학부", "건축설계전공", "건축시스템전공"],
  },
  {
    label: "조형대학",
    aliases: ["조형대", "디자인대"],
    departments: [
      "공업디자인학과",
      "시각디자인학과",
      "금속공예학과",
      "도자공예학과",
      "의상디자인학과",
      "공간디자인학과",
      "영상디자인학과",
      "자동차·운송디자인학과",
      "AI디자인학과",
    ],
  },
  {
    label: "예술대학",
    aliases: ["예대"],
    departments: [
      "음악학부",
      "성악전공",
      "피아노전공",
      "관현악전공",
      "작곡전공",
      "미술학부",
      "회화전공",
      "입체미술전공",
      "공연예술학부",
      "연극전공",
      "영화전공",
      "무용전공",
    ],
  },
  {
    label: "체육대학",
    aliases: ["체대"],
    departments: ["스포츠교육학과", "스포츠산업레저학과", "스포츠건강재활학과"],
  },
  {
    label: "미래융합대학",
    aliases: ["미융대", "미래융합대"],
    departments: ["인문기술융합학부", "자유전공", "미래융합전공"],
  },
];

function cleanKookminText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeLookupText(value: string) {
  return cleanKookminText(value)
    .toLocaleLowerCase("ko-KR")
    .replace(/[\s._-]+/g, "")
    .replace(/[·ㆍ]/g, "");
}

export function findCollege(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue = normalizeLookupText(value);

  return (
    KOOKMIN_COLLEGES.find((college) => {
      const searchableValues = [college.label, ...college.aliases];

      return searchableValues.some((candidate) => normalizeLookupText(candidate) === normalizedValue);
    }) ?? null
  );
}

export function findCollegeByDepartment(departmentValue: string | null | undefined) {
  if (!departmentValue) {
    return null;
  }

  const normalizedDepartment = normalizeLookupText(departmentValue);

  return (
    KOOKMIN_COLLEGES.find((college) =>
      college.departments.some(
        (department) => normalizeLookupText(department) === normalizedDepartment,
      ),
    ) ?? null
  );
}

export function normalizeCollegeName(value: string | null | undefined) {
  return findCollege(value)?.label ?? "";
}

export function normalizeDepartmentName(
  collegeLabel: string,
  departmentValue: string | null | undefined,
) {
  if (!departmentValue) {
    return "";
  }

  const college = findCollege(collegeLabel);
  const normalizedDepartment = normalizeLookupText(departmentValue);

  return (
    college?.departments.find(
      (department) => normalizeLookupText(department) === normalizedDepartment,
    ) ??
    findCollegeByDepartment(departmentValue)?.departments.find(
      (department) => normalizeLookupText(department) === normalizedDepartment,
    ) ??
    ""
  );
}

export function inferAcademicPlacementFromProfileName(
  value: string | null | undefined,
): KookminProfileNameParts {
  if (!value) {
    return {
      fullName: null,
      rawAffiliation: null,
      department: null,
      college: null,
    };
  }

  const cleaned = cleanKookminText(value);
  const match = cleaned.match(/^(.+?)\(([^)]*)\)$/u);

  if (!match) {
    return {
      fullName: cleaned || null,
      rawAffiliation: null,
      department: null,
      college: null,
    };
  }

  const fullName = cleanKookminText(match[1]);
  const rawAffiliation = cleanKookminText(match[2]);
  const departmentCandidate = rawAffiliation
    .split("-")
    .map((part) => cleanKookminText(part))
    .filter(Boolean)
    .at(-1);
  const college = findCollegeByDepartment(departmentCandidate);
  const department = normalizeDepartmentName(college?.label ?? "", departmentCandidate);

  return {
    fullName: fullName || null,
    rawAffiliation: rawAffiliation || null,
    department: department || departmentCandidate || null,
    college: college?.label ?? null,
  };
}
