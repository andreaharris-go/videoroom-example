export default function Layout2() {
  return (
    <>
      <div className="grid grid-cols-6 gap-2 p-2">
        <div className="col-span-5 h-screen">
          <div className=" overflow-hidden rounded-xl max-h-[42rem]">
            <img className="h-full w-full object-cover "
                 src="https://picsum.photos/735?grayscale&random=1"
                 alt="" />
          </div>
        </div>
        <div className="col-span-1 h-screen space-y-2">
          <div className=" overflow-hidden rounded-xl max-h-[10rem]">
            <img className="h-full w-full object-cover  "
                 src="https://picsum.photos/240?grayscale&random=2"
                 alt="" />
          </div>
          <div className=" overflow-hidden rounded-xl max-h-[10rem]">
            <img className="h-full w-full object-cover "
                 src="https://picsum.photos/240?grayscale&random=3"
                 alt="" />
          </div>
          <div className=" overflow-hidden rounded-xl max-h-[10rem]">
            <img className="h-full w-full object-cover "
                 src="https://picsum.photos/240?grayscale&random=4"
                 alt="" />
          </div>
          <div className="relative overflow-hidden rounded-xl col-span-2 max-h-[10rem]">
            <div
              className="text-white text-xl absolute inset-0  bg-slate-900/80 flex justify-center items-center">
              + 23
            </div>
            <img className="h-full w-full object-cover "
                 src="https://picsum.photos/735?grayscale&random=5"
                 alt="" />
          </div>
        </div>
      </div>
    </>
  )
}