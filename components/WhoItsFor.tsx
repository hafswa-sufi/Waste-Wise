import { Home, HandHeart, Recycle } from 'lucide-react'
const audiences = [
  {
    icon: Home,
    title: 'Kenyan Households',
    description:
      'Manage your pantry, reduce waste, and save money. Get alerts tailored to local storage conditions and open-air market produce.',
    accent: 'group-hover:bg-wastewise-green group-hover:text-white',
    iconColor: 'text-wastewise-green',
  },
  {
    icon: HandHeart,
    title: 'NGOs & Food Banks',
    description:
      'Receive real-time notifications when households have surplus food ready for collection. Streamline your donation logistics.',
    accent: 'group-hover:bg-wastewise-orange group-hover:text-white',
    iconColor: 'text-wastewise-orange',
  },
  {
    icon: Recycle,
    title: 'Recycling Companies',
    description:
      'Get coordinated pickup requests from multiple households in the same estate or apartment complex for efficient organic waste collection.',
    accent: 'group-hover:bg-blue-600 group-hover:text-white',
    iconColor: 'text-blue-600',
  },
]
export function WhoItsFor() {
  return (
    <section id="who-its-for" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Who is WasteWise for?
          </h2>
          <p className="text-xl text-gray-600">
            Connecting the entire ecosystem to eliminate food waste.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {audiences.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col h-full"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 transition-colors duration-300 ${item.accent}`}
                >
                  <Icon
                    className={`w-8 h-8 transition-colors duration-300 ${item.iconColor} group-hover:text-white`}
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed flex-1">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
