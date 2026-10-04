import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ caseId: string }>;
}

export default async function CasePage({ params }: Props) {
  const { caseId } = await params;
  redirect(`/case/${caseId}/documents`);
}
