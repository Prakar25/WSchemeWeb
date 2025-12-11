/* eslint-disable no-unused-vars */
import React from "react";

import childCareImg from "../../../assets/childCare.jpeg";
import motherImg from "../../../assets/expectingMother.jpeg";
import educationImg from "../../../assets/educationFinance.jpeg";
import childHealthImg from "../../../assets/childHealth.jpeg";
import childDevImg from "../../../assets/childDevelopment.jpeg";
import womenEmpImg from "../../../assets/womenEmpowerment.jpeg";

const Home = () => {
  return (
    <section className="min-h-screen">
      <div className="w-full">
        {/* Hero Section */}
        <div className="text-center py-14 bg-gray-50">
          <h1 className="text-4xl font-bold text-blue-900">
            Access Government Welfare Schemes Online
          </h1>
          <p className="mt-3 text-gray-700 max-w-2xl mx-auto">
            A single point of access for all welfare schemes for women and
            children from the State & Central Government.
          </p>

          {/* Search Filters */}
          <div className="bg-white shadow-md w-full max-w-3xl mx-auto mt-10 p-6 rounded-lg">
            <div className="grid md:grid-cols-3 gap-4">
              <select className="border rounded-md p-2 w-full">
                <option>Eligibility</option>
                <option>All</option>
              </select>

              <select className="border rounded-md p-2 w-full">
                <option>Age Group</option>
                <option>All</option>
              </select>

              <select className="border rounded-md p-2 w-full">
                <option>Category</option>
                <option>All</option>
              </select>
            </div>

            <button className="mt-5 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
              Search Schemes
            </button>
          </div>
        </div>

        {/* State Schemes */}
        <section className="max-w-7xl mx-auto mt-16 px-6">
          <h2 className="text-center text-2xl font-bold text-blue-900 mb-8">
            State Schemes
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white shadow rounded-lg p-4">
              <img
                src={childCareImg}
                className="rounded-md h-64 w-full object-cover"
              />
              <h3 className="font-semibold mt-4">Scheme for Child Care</h3>
              <p className="text-sm text-gray-600">
                Provides daycare services for children of working mothers.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white shadow rounded-lg p-4">
              <img
                src={motherImg}
                className="rounded-md h-64 w-full object-cover"
              />
              <h3 className="font-semibold mt-4">
                Support for Expectant Mothers
              </h3>
              <p className="text-sm text-gray-600">
                Offers financial assistance and healthcare support during
                pregnancy.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white shadow rounded-lg p-4">
              <img
                src={educationImg}
                className="rounded-md h-64 w-full object-cover"
              />
              <h3 className="font-semibold mt-4">
                Financial Aid for Education
              </h3>
              <p className="text-sm text-gray-600">
                Supports education for girls from disadvantaged backgrounds.
              </p>
            </div>
          </div>
        </section>

        {/* Central Schemes */}
        <section className="max-w-7xl mx-auto mt-20 px-6 pb-20">
          <h2 className="text-center text-2xl font-bold text-blue-900 mb-8">
            Central Schemes
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white shadow rounded-lg p-4">
              <img
                src={childHealthImg}
                className="rounded-md h-64 w-full object-cover"
              />
              <h3 className="font-semibold mt-4">
                National Child Health Program
              </h3>
              <p className="text-sm text-gray-600">
                Ensures comprehensive health services for children up to 18
                years.
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <img
                src={childDevImg}
                className="rounded-md h-64 w-full object-cover"
              />
              <h3 className="font-semibold mt-4">
                Integrated Child Development Services
              </h3>
              <p className="text-sm text-gray-600">
                Provides early childhood care and development services.
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <img
                src={womenEmpImg}
                className="rounded-md h-64 w-full object-cover"
              />
              <h3 className="font-semibold mt-4">Women Empowerment Scheme</h3>
              <p className="text-sm text-gray-600">
                Promotes economic and social empowerment of women.
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default Home;
