/**
 * Hierarchical Category Definition for Electric Motors (الکتروموتورها)
 * 
 * Single source of truth for:
 * - English URL slugs & routing
 * - Persian UI titles, breadcrumbs, descriptions
 * - Backend filter parameters (phase, shellType)
 * - Category cards images & metadata
 */

export interface MotorCategoryNode {
  /** English slug used in URL (e.g. 'single-phase', 'cast-iron') */
  slug: string;
  /** Full URL path (e.g. '/electromotors/single-phase/cast-iron') */
  href: string;
  /** Full Persian display title (e.g. 'الکتروموتورهای تک‌فاز چدنی') */
  title: string;
  /** Short Persian title for breadcrumbs (e.g. 'چدنی') */
  breadcrumbTitle: string;
  /** Persian description / subtitle */
  description: string;
  /** Category image path in /public */
  image: string;
  /** Filter criteria mapped to Prisma backend */
  filter: {
    category?: string;
    phase?: "single-phase" | "three-phase";
    shellType?: "cast-iron" | "aluminum";
  };
  /** Child categories in hierarchy */
  children?: MotorCategoryNode[];
}

export interface BreadcrumbItemData {
  title: string;
  href: string;
  isCurrent: boolean;
}

export const ROOT_MOTOR_CATEGORY: MotorCategoryNode = {
  slug: "electromotors",
  href: "/electromotors",
  title: "الکتروموتورها",
  breadcrumbTitle: "الکتروموتورها",
  description: "بررسی مشخصات فنی، سایزها و استعلام قیمت انواع الکتروموتورهای صنعتی تک‌فاز و سه‌فاز",
  image: "",
  filter: {
    category: "electromotor",
  },
  children: [
    {
      slug: "single-phase",
      href: "/electromotors/single-phase",
      title: "الکتروموتورهای تک‌فاز",
      breadcrumbTitle: "تک‌فاز",
      description: "انواع الکتروموتورهای صنعتی تک‌فاز ۲۲۰ ولت در مدل‌های پوسته چدنی و آلومینیومی",
      image: "",
      filter: {
        phase: "single-phase",
      },
      children: [
        {
          slug: "cast-iron",
          href: "/electromotors/single-phase/cast-iron",
          title: "الکتروموتورهای تک‌فاز چدنی",
          breadcrumbTitle: "چدنی",
          description: "الکتروموتورهای تک‌فاز با بدنه مقاوم چدنی مناسب برای کاربری‌های سنگین و صنعتی",
          image: "",
          filter: {
            phase: "single-phase",
            shellType: "cast-iron",
          },
        },
        {
          slug: "aluminum",
          href: "/electromotors/single-phase/aluminum",
          title: "الکتروموتورهای تک‌فاز آلومینیومی",
          breadcrumbTitle: "آلومینیومی",
          description: "الکتروموتورهای تک‌فاز با بدنه سبک آلومینیومی و راندمان حرارتی بالا",
          image: "",
          filter: {
            phase: "single-phase",
            shellType: "aluminum",
          },
        },
      ],
    },
    {
      slug: "three-phase",
      href: "/electromotors/three-phase",
      title: "الکتروموتورهای سه‌فاز",
      breadcrumbTitle: "سه‌فاز",
      description: "انواع الکتروموتورهای صنعتی سه‌فاز ۳۸۰ ولت با توان‌ها و دورهای متنوع برای خطوط تولید و صنایع",
      image: "",
      filter: {
        phase: "three-phase",
      },
      children: [
        {
          slug: "cast-iron",
          href: "/electromotors/three-phase/cast-iron",
          title: "الکتروموتورهای سه‌فاز چدنی",
          breadcrumbTitle: "چدنی",
          description: "الکتروموتورهای سه‌فاز استاندارد صنعتی با بدنه چدن نشکن و دوام فوق‌العاده",
          image: "",
          filter: {
            phase: "three-phase",
            shellType: "cast-iron",
          },
        },
        {
          slug: "aluminum",
          href: "/electromotors/three-phase/aluminum",
          title: "الکتروموتورهای سه‌فاز آلومینیومی",
          breadcrumbTitle: "آلومینیومی",
          description: "الکتروموتورهای سه‌فاز با بدنه آلومینیومی سبک، انتقال حرارت بهینه و طراحی مدرن",
          image: "",
          filter: {
            phase: "three-phase",
            shellType: "aluminum",
          },
        },
      ],
    },
  ],
};

/**
 * Resolve active category node given URL slug segments (e.g. ['single-phase', 'cast-iron']).
 */
export function getMotorCategoryByPath(slugs: string[] = []): {
  activeNode: MotorCategoryNode;
  parentChain: MotorCategoryNode[];
  isValid: boolean;
} {
  if (!slugs || slugs.length === 0) {
    return {
      activeNode: ROOT_MOTOR_CATEGORY,
      parentChain: [ROOT_MOTOR_CATEGORY],
      isValid: true,
    };
  }

  const chain: MotorCategoryNode[] = [ROOT_MOTOR_CATEGORY];
  let current = ROOT_MOTOR_CATEGORY;

  for (const slug of slugs) {
    const child = current.children?.find((c) => c.slug === slug);
    if (!child) {
      return {
        activeNode: current,
        parentChain: chain,
        isValid: false,
      };
    }
    chain.push(child);
    current = child;
  }

  return {
    activeNode: current,
    parentChain: chain,
    isValid: true,
  };
}

/**
 * Generate RTL Persian breadcrumb chain for the given category slugs.
 */
export function getMotorBreadcrumbs(slugs: string[] = []): BreadcrumbItemData[] {
  const { parentChain } = getMotorCategoryByPath(slugs);

  const crumbs: BreadcrumbItemData[] = [
    {
      title: "خانه",
      href: "/",
      isCurrent: false,
    },
  ];

  parentChain.forEach((node, index) => {
    const isCurrent = index === parentChain.length - 1;
    crumbs.push({
      title: node.breadcrumbTitle,
      href: node.href,
      isCurrent,
    });
  });

  return crumbs;
}

/**
 * Returns child category cards for the active category node.
 */
export function getChildMotorCategories(slugs: string[] = []): MotorCategoryNode[] {
  const { activeNode } = getMotorCategoryByPath(slugs);
  return activeNode.children || [];
}

/**
 * Returns sibling category cards if at a leaf level.
 */
export function getSiblingMotorCategories(slugs: string[] = []): MotorCategoryNode[] {
  if (!slugs || slugs.length === 0) return [];
  const parentSlugs = slugs.slice(0, -1);
  const { activeNode: parentNode } = getMotorCategoryByPath(parentSlugs);
  return parentNode.children || [];
}
