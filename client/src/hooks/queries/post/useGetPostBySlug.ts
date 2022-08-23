import PostAPI from '@/lib/api/post';
import type { Post } from '@/lib/types';
import type { CustomAxiosError } from '@/lib/error';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';

const useGetPostBySlug = (slug: string, options?: UseQueryOptions<Post, CustomAxiosError>) => {
  return useQuery<Post, CustomAxiosError>(
    ['GetPostBySlug', slug],
    () => PostAPI.getPostBySlug(slug),
    options,
  );
};

useGetPostBySlug.fetcher = (slug: string) => () => PostAPI.getPostBySlug(slug);
useGetPostBySlug.getKey = (slug: string) => ['GetPostBySlug', slug];

export default useGetPostBySlug;