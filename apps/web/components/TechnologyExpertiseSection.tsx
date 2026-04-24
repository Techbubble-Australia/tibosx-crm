import Image from "next/image";
import techServiceNowLogo from "@image/techbubble_-_home_17.png";
import techSalesforceLogo from "@image/techbubble_-_home_18.png";
import techMuleSoftLogo from "@image/techbubble_-_home_19.png";
import techSharePointLogo from "@image/techbubble_-_home_20.png";
import techPowerBILogo from "@image/techbubble_-_home_21.png";
import techSnowflakeLogo from "@image/techbubble_-_home_22.png";
import techOracleLogo from "@image/techbubble_-_home_23.png";
import techMicrosoftAILogo from "@image/techbubble_-_home_24.png";
import techSeleniumLogo from "@image/techbubble_-_home_25.png";
import techAzureLogo from "@image/techbubble_-_home_26.png";
import techAwsLogo from "@image/techbubble_-_home_27.png";
import techInformaticaLogo from "@image/techbubble_-_home_28.png";
import techReactLogo from "@image/techbubble_-_home_29.png";
import techJavaLogo from "@image/techbubble_-_home_30.png";
import techAppleAndroidLogo from "@image/techbubble_-_home_31.png";
import techDynamicsLogo from "@image/techbubble_-_home_32.jpg";

const technologyCards = [
  { name: "ServiceNow", image: techServiceNowLogo },
  { name: "Salesforce", image: techSalesforceLogo },
  { name: "MuleSoft", image: techMuleSoftLogo },
  { name: "SharePoint", image: techSharePointLogo },
  { name: "Power BI", image: techPowerBILogo },
  { name: "Snowflake", image: techSnowflakeLogo },
  { name: "Oracle", image: techOracleLogo },
  { name: "Microsoft AI", image: techMicrosoftAILogo },
  { name: "Selenium", image: techSeleniumLogo },
  { name: "Azure", image: techAzureLogo },
  { name: "AWS", image: techAwsLogo },
  { name: "Informatica", image: techInformaticaLogo },
  { name: "React", image: techReactLogo },
  { name: "Java", image: techJavaLogo },
  { name: "Mobile Dev", image: techAppleAndroidLogo },
  { name: "MS Dynamics", image: techDynamicsLogo },
];

export function TechnologyExpertiseSection() {
  return (
    <section className="bg-white py-[120px]">
      <div className="tb-container text-center">
        <div className="mb-2.5 inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
          <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
          <p className="text-xs font-medium leading-4 text-[#666666]">ACROSS THE TECHNOLOGY OFFERINGS</p>
        </div>
        <h2 className="mt-4 text-[56px] font-bold leading-[64px] tracking-[-0.005em] text-[#111111]">
          Technology Expertise
        </h2>
        <p className="mx-auto mt-2 text-[18px] leading-7 text-[#666666]">
          We work across the full enterprise technology stack.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-[1591px] bg-[#e7e5e0]">
        <div className="grid grid-cols-4 gap-px md:grid-cols-8">
          {technologyCards.map((t) => (
            <div
              key={t.name}
              className="flex h-[112px] flex-col items-center justify-center bg-white"
            >
              <Image
                src={t.image}
                alt={t.name}
                className="max-h-[48px] w-auto max-w-[130px] object-contain"
              />
              <span className="mt-2 text-[10px] font-medium tracking-[0.01em] text-[#737370]">
                {t.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}