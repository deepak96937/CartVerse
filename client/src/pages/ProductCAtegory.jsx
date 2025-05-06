import React from 'react'
import { useAppContext } from '../context/AppContext'
import { useParams } from 'react-router-dom'
import { categories } from '../assets/assets'
import ProductCard from '../components/ProductCard'

const ProductCAtegory = () => {
  const { products } = useAppContext()
  const { category } = useParams();

  const searchCatergory = categories.find((item) => item.path.toLocaleLowerCase() === category)
  const filteredProducts = products.filter((product) => product.category.toLocaleLowerCase() === category)

  return (
    <div className=' mt-16'>
      {
        searchCatergory && (
          <div className="flex flex-col items-end w-max">
            <p className=' text-2xl font-medium'>{searchCatergory.text.toUpperCase()}</p>
            <div className="w-16 h-0.5 bg-primary rounded-full"></div>
          </div>
        )
      }

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className=" flex items-center justify-center h-[60vh]">
          <p className=' text-2xl font-medium text-primary'>No products found in this category.</p>
        </div>
      )}
    </div>
  )
}

export default ProductCAtegory
