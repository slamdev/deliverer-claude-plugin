# Glossary

**Visible width**:
The number of columns a string takes up in a fixed-width terminal, which is what `visibleWidth` measures: ANSI escapes
count for nothing, however many code units they carry.
_Avoid_: length, size

**Cell**:
One string laid out inside one column of a row, cut to the column's width and aligned inside what is left.
_Avoid_: field, item
