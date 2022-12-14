import { Card, Skeleton } from '@/components/common';
import useGetPostsByQueries from '@/hooks/queries/post/useGetPostsByQueries';
import type { GetPostsByQueriesResult } from '@/lib/types';
import useGetME from '@/hooks/queries/user/useGetMe';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import formatDate from '@/lib/utils/formatDate';
import styled from '@emotion/styled';
import {
  dehydrate,
  DehydratedState,
  InfiniteData,
  QueryClient,
} from '@tanstack/react-query';
import type {
  GetServerSideProps,
  GetServerSidePropsResult,
  NextPage,
} from 'next';
import Link from 'next/link';
import TabLayout from '@/components/Layouts/TabLayout';

const Home: NextPage = () => {
  const { data, hasNextPage, fetchNextPage, isFetching } =
    useGetPostsByQueries();

  const loadMore = () => {
    if (hasNextPage) fetchNextPage();
  };

  const targetElement = useIntersectionObserver({ onIntersect: loadMore });

  return (
    <TabLayout>
      <List>
        {data?.pages?.map((page) =>
          page.posts.map((post) => (
            <div key={post.id}>
              <Card variant="bordered" isPressable>
                <Link href={`/post/${encodeURIComponent(post.slug)}`}>
                  <a>
                    <div>
                      <div>제목 : {post.title}</div>
                      <div>좋아요 : {post.postStats.likes}</div>
                      <div>{formatDate(post.createdAt)}</div>
                    </div>
                  </a>
                </Link>
              </Card>
            </div>
          )),
        )}
      </List>
      {isFetching && <Skeleton />}
      <InfiniteScrollTarget ref={targetElement} />
    </TabLayout>
  );
};

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InfiniteScrollTarget = styled.div`
  visibility: hidden;
  width: 100%;
`;

export const getServerSideProps: GetServerSideProps = async (): Promise<
  GetServerSidePropsResult<{
    dehydratedState: DehydratedState;
  }>
> => {
  const queryClient = new QueryClient();
  try {
    await Promise.all([
      queryClient.fetchInfiniteQuery(
        useGetPostsByQueries.getKey(),
        useGetPostsByQueries.fetcher(),
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor ?? false,
        },
      ),
      queryClient.fetchQuery(useGetME.getKey(), useGetME.fetcher()),
    ]);
    const pages = queryClient.getQueryData<
      InfiniteData<GetPostsByQueriesResult>
    >(useGetPostsByQueries.getKey())?.pages;
    queryClient.setQueryData(useGetPostsByQueries.getKey(), {
      pages,
      pageParams: [null],
    });
    return { props: { dehydratedState: dehydrate(queryClient) } };
  } catch (e) {
    queryClient.resetQueries({ queryKey: useGetPostsByQueries.getKey() });
    return { props: { dehydratedState: dehydrate(queryClient) } };
  } finally {
    queryClient.clear();
  }
};

export default Home;
