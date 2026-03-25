import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import pxLogo from '@/public/assets/images/px-logo.svg';
import { getI18nPath } from '@/utils/Helpers';

type SignInPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(
  props: SignInPageProps
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'SignIn',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignInPage(props: SignInPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col items-center">
      <Image
        src={pxLogo}
        alt="Project X"
        width={120}
        height={50}
        className="mb-8"
      />
      <SignIn path={getI18nPath('/sign-in', locale)} />
    </div>
  );
}
