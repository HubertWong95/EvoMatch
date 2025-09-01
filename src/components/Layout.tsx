import background from "@/assets/otherBckgrd.png";

const Layout = () => {
  return (
    <div
      className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
      style={{
        backgroundImage: `url(${background})`,
        imageRendering: "pixelated",
      }}
    />
  );
};

export default Layout;
