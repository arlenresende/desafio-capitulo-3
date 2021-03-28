import {  GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import  Head  from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}


export default function Post({ post } : PostProps ) {

  const router = useRouter();

  if (router.isFallback){
    return <h1>Carregando...</h1>
  }

  const TotalWords = post.data.content.reduce((total, item) => {
    total += item.heading.split(' ').length;

    const words = item.body.map(itemw => itemw.text.split(' ').length);
    words.map(word => (total += word));

    return total;
  },0);

  const time = Math.ceil(TotalWords / 200);


   const formatedPost = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  )



  return(
    <>
    <Head>
      <title>{`${post.data.title}`}</title>
    </Head>
    <Header />
    <img className={styles.banner} src={post.data.banner.url} alt=""/>
    <main className={commonStyles.container}>
      <div className={styles.postHeader}>
        <h1>{post.data.title}</h1>
        <ul>
          <li>
            <FiCalendar/>
            <span>{formatedPost}</span>
          </li>
          <li>
            <FiUser/>
            <span>{post.data.author}</span>
          </li>
          <li>
            <FiClock/>
            {`${time} min`}
          </li>
        </ul>
        {post.data.content.map(content => {
         return(
          <article className={styles.postContainer} key={content.heading}>
            <h2>{content.heading}</h2>
            <div dangerouslySetInnerHTML={{__html : RichText.asHtml(content.body)}}></div>
        </article>
         )
       })}
      </div>
    </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
 const posts = await prismic.query(
  Prismic.predicates.at('document.type','publication')

 );

 const paths = posts.results.map(post => {

  return {
    params: {
      slug: post.uid,
    }
  }

 })

 return {
   paths,
   fallback: true,
 };


};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return{
          heading: content.heading,
          body: [...content.body]
        }
      })

    },

  }


  return {
    props: {
      post,
    }
  }
};
