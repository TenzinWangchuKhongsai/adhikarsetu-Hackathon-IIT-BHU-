import { redirect } from 'next/navigation';

interface Props {
  params: { caseId: string };
}

// Redirect /case/[caseId] → /case/[caseId]/documents
export default function CasePage({ params }: Props) {
  redirect(`/case/${params.caseId}/documents`);
}
