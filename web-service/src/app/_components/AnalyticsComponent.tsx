import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import ImageZoom from "./ImageZoom";

interface AnalyticsComponentProps {
  heading: string;
  image: string;
  explanation: string;
}

const AnalyticsComponent = ({
  heading,
  image,
  explanation,
}: AnalyticsComponentProps) => {
  const imageUrl = `data:image/png;base64,${image}`;
  return (
    <Card className="w-full my-4 shadow-none border">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">{heading}</CardTitle>
      </CardHeader>
      <CardContent>
        <ImageZoom src={imageUrl} alt={heading}>
          <div className="w-full mb-4 bg-gray-200 rounded-lg flex items-center justify-center h-64 relative group cursor-pointer">
            <Image
              src={imageUrl}
              alt={heading}
              layout="fill"
              objectFit="contain"
            />
            <div className="absolute inset-0 transition-all duration-300 flex items-center justify-center">
              <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 rounded-md px-2 py-1">
                Click to zoom
              </p>
            </div>
          </div>
        </ImageZoom>
        <div>
          <h3 className="font-semibold text-lg mb-2">Details</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {explanation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsComponent;
