import { notFound } from "next/navigation";
import {
  getBusinessBySlug,
  getPublishedCoursesForBusiness,
} from "@/src/modules/courses/actions/booking-actions";
import BusinessPublicView from "@/src/modules/courses/ui/views/business-public-view";

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;

  const businessResult = await getBusinessBySlug(slug);

  if (!businessResult.success || !businessResult.business || !businessResult.business.slug) {
    notFound();
  }

  const business = {
    ...businessResult.business,
    slug: businessResult.business.slug,
  };

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 30);

  const coursesResult = await getPublishedCoursesForBusiness(businessResult.business.id, {
    from,
    to,
  });

  return (
    <BusinessPublicView
      business={business}
      initialCourses={
        (coursesResult.courses ?? []) as Parameters<typeof BusinessPublicView>[0]["initialCourses"]
      }
      initialWindow={{ from, to }}
    />
  );
}
