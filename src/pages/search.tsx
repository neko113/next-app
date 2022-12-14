import useGetME from '@/hooks/queries/user/useGetMe';
import styled from '@emotion/styled';
import { DehydratedState, QueryClient, dehydrate } from '@tanstack/react-query';
import { GetServerSideProps, GetServerSidePropsResult } from 'next';
import { useState } from 'react';
import useDebounce from '@/hooks/useDebounce';
import { TextInput, Card } from '@/components/common';
import useGetSearchPosts from '@/hooks/queries/post/useGetSearchPosts';
import formatDate from '@/lib/utils/formatDate';
import Link from 'next/link';
import mediaQuery from '@/lib/styles/mediaQuery';
import TabLayout from '@/components/Layouts/TabLayout';

const Search = () => {
  const [searchText, setSearchText] = useState<string>('');
  const debouncedText = useDebounce<string>({ value: searchText });

  const { data } = useGetSearchPosts(debouncedText, {
    retry: true,
    suspense: false,
    enabled: !!debouncedText,
  });
  return (
    <TabLayout>
      <TextInput
        placeholder="Search"
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <div>
        {data?.map((post) => (
          <CardBox key={post.id}>
            <Card variant="bordered" isPressable>
              <Link href={`/post/${encodeURIComponent(post.slug)}`}>
                <a>
                  <div>
                    <div>제목 : {post.title}</div>
                    <div>{formatDate(post.createdAt)}</div>
                  </div>
                </a>
              </Link>
            </Card>
          </CardBox>
        ))}
      </div>
    </TabLayout>
  );
};

const CardBox = styled.div`
  margin: 1rem 0;
`;

export const getServerSideProps: GetServerSideProps = async (): Promise<
  GetServerSidePropsResult<{
    dehydratedState: DehydratedState;
  }>
> => {
  const queryClient = new QueryClient();

  try {
    await queryClient.fetchQuery(useGetME.getKey(), useGetME.fetcher());

    return { props: { dehydratedState: dehydrate(queryClient) } };
  } finally {
    queryClient.clear();
  }
};

export default Search;
