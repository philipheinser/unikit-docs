import React, { useState, useEffect } from "react";
import { useSpring, animated } from "react-spring/native";
import * as PropTypes from "prop-types";

import { useLayout, useGesture } from "../hooks";
import styled, { withThemeProps, useTheme } from "../styled";
import { getProgress, getValueByProgress } from "../util";
import Button from "../Button";

const Wrap = styled.View();
const TrackWrap = styled.View();
const TicksWrap = styled.View({ web: { userSelect: "none" } });
const TickWrap = styled.View();
const Tick = styled.Text();
const Track = styled.View();
const TrackProgress = animated(styled.View());
const Value = styled.View();
const Handle = styled.View();
const HandleWrap = animated(
  styled.View({
    web: {
      cursor: "grab"
    }
  })
);

const getTicks = ({ min, max, ticks }) => {
  const arr = [min];
  let last = min + ticks;
  while (last < max) {
    arr.push(last);
    last = last + ticks;
  }
  arr.push(max);
  return arr;
};

const Slider = withThemeProps(
  ({
    value = 0,
    onChange,
    onSwipe,
    progressColor = "primary",
    trackColor = "background",
    trackHeight = 10,
    valueSize = 28,
    valueGap = 5,
    handleSize = 30,
    handleFactor = 2,
    handleColor = "#FFF",
    min = 0,
    max = 100,
    steps = 1,
    showValue = false,
    valueSuffix,
    showTicks = true,
    ticks,
    tickGap = 5,
    vertical = false,
    minDistance = 5,
    handleProps = {},
    springConfig = {},
    ...rest
  }) => {
    const theme = useTheme();
    const [down, setDown] = useState(false);
    const [progress, setProgress] = useState(() =>
      getProgress(min, max, value)
    );
    const { onLayout, width, height } = useLayout();
    const size = vertical ? height : width;

    const { dist } = useSpring({
      to: { dist: progress * size },
      immediate: down,
      ...springConfig
    });

    useEffect(() => {
      setProgress(getProgress(min, max, value));
    }, [value]);

    useEffect(() => {
      if (down === false) {
        let newValue = getValueByProgress(min, max, progress);
        if ((newValue / steps) % 1 != 0) {
          newValue = Math.round(newValue / steps) * steps;
        }
        setProgress(getProgress(min, max, newValue));
        if (onChange) onChange(newValue);
      }
    }, [down]);

    const bindGesture = useGesture(
      {
        onMoveShouldSetPanResponderCapture: (e, { dy, dx }) => {
          const allow = Math.abs(vertical ? dy : dx) > minDistance;
          return allow;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e, { dy, dx }) => {
          setDown(true);
        },
        onPanResponderMove: (e, { dy, dx }) => {
          const dist = vertical ? dy : dx;
          const currentPosition = progress * size + dist;
          let newProgress = getProgress(0, size, currentPosition);
          if (newProgress < min) {
            newProgress = min;
          } else if (newProgress > max / 100) {
            newProgress = max / 100;
          }
          if (onSwipe) onSwipe(newProgress);
          setProgress(newProgress);
        },
        onPanResponderRelease: (e, { vx, vy }) => {
          setDown(false);
        }
      },
      [size, down]
    );

    const leftAlign = -(
      (handleSize * handleFactor - (vertical ? handleSize : 0)) /
      2
    );
    const topAlign = -(
      (handleSize * handleFactor - (vertical ? 0 : handleSize)) /
      2
    );

    return (
      <Wrap
        w={vertical ? handleSize : "100%"}
        h={vertical ? "100%" : handleSize}
        relative
        row={vertical}
        {...bindGesture}
        {...rest}
      >
        <TrackWrap
          relative
          flexCenter
          w={vertical ? handleSize : "100%"}
          h={vertical ? "100%" : handleSize}
          onLayout={onLayout}
        >
          <Track
            w={vertical ? trackHeight : "100%"}
            h={vertical ? "100%" : trackHeight}
            bg={trackColor}
            borderRadius={theme.globals.roundness}
          >
            <TrackProgress
              w={vertical ? trackHeight : "0%"}
              h={vertical ? "0%" : trackHeight}
              bg={progressColor}
              borderRadius={theme.globals.roundness}
              style={{
                width: vertical ? "100%" : dist,
                height: !vertical ? "100%" : dist
              }}
            />
          </Track>
          <HandleWrap
            l={leftAlign}
            t={topAlign}
            bg="primary"
            alpha={down ? 0.2 : 0}
            absolute
            w={handleSize * handleFactor}
            h={handleSize * handleFactor}
            borderRadius={(handleSize * handleFactor) / 2}
            style={{
              transform: vertical
                ? [{ translateY: dist }]
                : [{ translateX: dist }]
            }}
            flexCenter
          >
            <Handle
              w={handleSize}
              h={handleSize}
              bg={handleColor}
              borderRadius={handleSize / 2}
              shadow={5}
              flexCenter
              {...handleProps}
            >
              {showValue === true || (showValue === "onDown" && down) ? (
                <Value
                  b={handleSize + valueGap}
                  pointerEvents="none"
                  flexCenter
                  absolute
                  minWidth={100}
                >
                  <Button size={valueSize} rounded>
                    {`${Math.round(getValueByProgress(min, max, progress))}${
                      valueSuffix ? valueSuffix : ""
                    }`}
                  </Button>
                </Value>
              ) : null}
            </Handle>
          </HandleWrap>
        </TrackWrap>

        {showTicks ? (
          <TicksWrap
            absolute
            l={vertical ? handleSize + tickGap : -(handleSize / 2)}
            t={vertical ? -(handleSize / 2) : handleSize + tickGap}
            r={vertical ? "auto" : -(handleSize / 2)}
            b={!vertical ? "auto" : -(handleSize / 2)}
            justify="space-between"
            row={!vertical}
            pointerEvents="none"
          >
            {getTicks({
              min,
              max,
              ticks: ticks ? ticks : steps < 10 ? 10 : steps
            }).map((tick, index) => {
              return (
                <TickWrap
                  w={!vertical ? handleSize : "auto"}
                  h={!vertical ? "auto" : handleSize}
                  flexCenter
                >
                  <Tick color="text" font="caption">
                    {tick}
                  </Tick>
                </TickWrap>
              );
            })}
          </TicksWrap>
        ) : null}
      </Wrap>
    );
  },
  "Slider"
);

Slider.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  onSwipe: PropTypes.func,
  progressColor: PropTypes.string,
  trackColor: PropTypes.string,
  trackHeight: PropTypes.number,
  valueSize: PropTypes.number,
  valueGap: PropTypes.number,
  handleSize: PropTypes.number,
  handleFactor: PropTypes.number,
  handleColor: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  steps: PropTypes.number,
  showValue: PropTypes.oneOf([PropTypes.bool, "onDown"]),
  valueSuffix: PropTypes.string,
  showTicks: PropTypes.bool,
  ticks: PropTypes.number,
  tickGap: PropTypes.number,
  vertical: PropTypes.bool,
  minDistance: PropTypes.number,
  handleProps: PropTypes.object,
  springConfig: PropTypes.object
};

Slider.defaultProps = {
  value: 0,
  progressColor: "primary",
  trackColor: "background",
  trackHeight: 10,
  valueSize: 28,
  valueGap: 5,
  handleSize: 30,
  handleFactor: 2,
  handleColor: "#FFF",
  min: 0,
  max: 100,
  steps: 1,
  showValue: false,
  showTicks: true,
  tickGap: 5,
  vertical: false,
  minDistance: 5,
  handleProps: {},
  springConfig: {}
};

export default Slider;
