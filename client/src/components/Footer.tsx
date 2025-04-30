export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-neutral-500">&copy; {new Date().getFullYear()} Scrum Poker. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-neutral-500 hover:text-neutral-700">About</a>
            <a href="#" className="text-neutral-500 hover:text-neutral-700">Privacy</a>
            <a href="#" className="text-neutral-500 hover:text-neutral-700">Terms</a>
            <a href="#" className="text-neutral-500 hover:text-neutral-700">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
