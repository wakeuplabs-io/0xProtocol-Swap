import Footer from "./Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full">
            <div className="container mx-auto p-10 card rounded-[30px] bg-white xl:w-2/5 xl:min-h-[75vh] flex flex-col">
                <div className="flex-grow h-full flex flex-col">{children}</div>
                <Footer />
            </div>
        </div>
    );
}
