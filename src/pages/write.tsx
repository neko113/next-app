import useCreatePost from '@/hooks/queries/post/useCreatePost';
import {
  dehydrate,
  DehydratedState,
  QueryClient,
  useQueryClient,
} from '@tanstack/react-query';
import { GetServerSideProps, GetServerSidePropsResult, NextPage } from 'next';
import Router from 'next/router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import useGetME from '@/hooks/queries/user/useGetMe';
import { TextInput, Button, ErrorMessage } from '@/components/common';
import styled from '@emotion/styled';
import { flexCenter } from '@/lib/styles/shared';
import useGetPostsByQueries from '@/hooks/queries/post/useGetPostsByQueries';
import { extractError } from '@/lib/error';
import TabLayout from '@/components/Layouts/TabLayout';

interface IFormInput {
  title: string;
  body: string;
}

const schema = yup.object().shape({
  title: yup.string().required('필수항목입니다'),
  body: yup.string().required('필수 항목입니다'),
});

const Write: NextPage = () => {
  const queryClient = useQueryClient();
  const { mutate } = useCreatePost({
    onSuccess: async () => {
      await queryClient.invalidateQueries(useGetPostsByQueries.getKey());
      Router.push('/');
    },
    onError: (e) => {
      const error = extractError(e);
      alert(error.message);
    },
  });
  const onSubmit = ({ title, body }: IFormInput) => {
    mutate({ title, body });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>({
    resolver: yupResolver(schema),
    mode: 'onChange',
  });
  return (
    <TabLayout>
      <Container>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            {...register('title')}
            type="text"
            color="secondary"
            placeholder="TITLE"
          />
          <ErrorMessage>{errors.title?.message}</ErrorMessage>
          <TextInput
            {...register('body')}
            type="text"
            color="secondary"
            placeholder="BODY"
          />
          <ErrorMessage>{errors.body?.message}</ErrorMessage>
          <Button size="auto" shadow type="submit">
            POST
          </Button>
        </Form>
      </Container>
    </TabLayout>
  );
};

const Container = styled.div`
  ${flexCenter}
`;

const Form = styled.form`
  margin-top: 4rem;
  width: 250px;
  ${flexCenter}
  flex-direction: column;
  button {
    margin-top: 1rem;
  }
`;
export const getServerSideProps: GetServerSideProps = async (): Promise<
  GetServerSidePropsResult<{
    dehydratedState: DehydratedState;
  }>
> => {
  const queryClient = new QueryClient();
  try {
    const user = await queryClient.fetchQuery(
      useGetME.getKey(),
      useGetME.fetcher(),
    );
    if (!user)
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    return { props: { dehydratedState: dehydrate(queryClient) } };
  } finally {
    queryClient.clear();
  }
};

export default Write;
