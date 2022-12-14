import { GetServerSideProps, GetServerSidePropsResult, NextPage } from 'next';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import useLogin from '@/hooks/queries/auth/useLogin';
import useGetME from '@/hooks/queries/user/useGetMe';
import { DehydratedState, QueryClient, dehydrate } from '@tanstack/react-query';
import { TextInput, Button, ErrorMessage } from '@/components/common';
import styled from '@emotion/styled';
import { flexCenter } from '@/lib/styles/shared';
import { extractError } from '@/lib/error';
import TabLayout from '@/components/Layouts/TabLayout';

interface IFormInput {
  username: string;
  password: string;
}

const schema = yup.object().shape({
  username: yup.string().required('필수항목입니다'),
  password: yup.string().required('필수항목입니다'),
});

const Login: NextPage = () => {
  const router = useRouter();
  const next =
    typeof router.query.next === 'string'
      ? router.query.next
      : Array.isArray(router.query.next)
      ? router.query.next[0]
      : '/';
  const { mutate } = useLogin({
    onSuccess: async () => {
      router.push(next);
    },
    onError: (e) => {
      console.log(e);
      const error = extractError(e);
      alert(error.message);
    },
  });
  const onSubmit = ({ username, password }: IFormInput) => {
    mutate({ username, password });
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
            {...register('username')}
            type="text"
            placeholder="username"
            variant="underlined"
          />
          <ErrorMessage>{errors.username?.message}</ErrorMessage>
          <TextInput
            {...register('password')}
            type="password"
            placeholder="password"
            variant="underlined"
          />
          <ErrorMessage>{errors.password?.message}</ErrorMessage>
          <Button shadow size="auto" type="submit">
            LOGIN
          </Button>
          <Button
            shadow
            size="auto"
            type="button"
            color="success"
            onClick={() => router.push('/register')}
          >
            REGISTER
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
    if (user)
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    return { props: { dehydratedState: dehydrate(queryClient) } };
  } finally {
    queryClient.clear();
  }
};

export default Login;
