/* eslint-disable react/no-unused-prop-types */
import { GetStaticProps } from 'next';
import Header from '../components/Header';

import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';

import styles from './home.module.scss';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import  Head  from 'next/head';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

 export default function Home({ postsPagination } : HomeProps)  {

  const formatedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      )
    }
  })




  const [posts, SetPosts] = useState<Post[]>(formatedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);



  async function handleLoadMorePosts(): Promise<void>{

    if (currentPage !== 1 && nextPage === null){
      return;
    }

    const postResults = await fetch(`${nextPage}`).then(response =>
      response.json()
      );


    setNextPage(postResults.next_page);
    setCurrentPage(postResults.page);

    const newPosts = postResults.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data :{
          title : post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,

        },
    }
    })

    SetPosts([...posts, ...newPosts]);



  }


  return(
    <>
    <Head>
      <title>Home | Space</title>
    </Head>
      <main className={commonStyles.container}>
        <Header />
        <div className={styles.posts}>
          {posts.map(post => (
              <Link href={`/post/${post.uid}`}  key={post.uid} >
                <a >
                  <h2>{post.data.title}</h2>
                  <p>{post.data.subtitle}</p>
                  <ul>
                    <li>
                      <FiCalendar/>
                      <span>{post.first_publication_date}</span>
                    </li>
                    <li>
                      <FiUser/>
                      <span>{post.data.author}</span>
                    </li>
                  </ul>
                </a>

          </Link>
            ))}

          {nextPage && (
            <button onClick={handleLoadMorePosts} className={commonStyles.loadMore} type="button">
            Carregar mais posts
          </button>
          )}

        </div>

      </main>
    </>
  )
 }

 export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type','posts')
  ],
  {
    pageSize: 1,

  });




  const posts = postsResponse.results.map(post => {
    return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data:{
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
    }
})

const postsPagination = {
   next_page: postsResponse.next_page,
   results: posts,

}

  return {
    props: {
      postsPagination,
    }
}

};
