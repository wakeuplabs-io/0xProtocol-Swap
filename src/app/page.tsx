import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Toaster } from "sonner";
import { DM_Sans } from 'next/font/google'
import classNames from "classnames";
import HomePage from "../frontend/pages/HomePage";

const dmSans = DM_Sans({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
  })

const Home: NextPage = () => {
    return (
        <div className={classNames(styles.container, dmSans.className)}>
            <Head>
                <title>0x gasless swap applet</title>
                <meta
                    content="Generated by @rainbow-me/create-rainbowkit"
                    name="description"
                />
                <link href="/favicon.ico" rel="icon" />
            </Head>
            <Toaster />
            <main className={styles.main}>
               <HomePage />
            </main>
        </div>
    );
};

export default Home;
